import axios, { AxiosInstance } from 'axios';
import type {
  JiraConfig,
  JiraSearchResponse,
  JiraWorklog,
  JiraComment,
  JiraProject
} from './types/jira.js';
import { Cache, RateLimiter, retryWithBackoff } from './utils/cache-and-rate-limit.js';

export class JiraClient {
  private client: AxiosInstance;
  private config: JiraConfig;
  private cache: Cache;
  private rateLimiter: RateLimiter;

  constructor(config: JiraConfig) {
    this.config = config;
    this.cache = new Cache(5 * 60 * 1000); // 5 minutes TTL
    this.rateLimiter = new RateLimiter(10, 2); // 10 tokens, refill 2/second
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      auth: {
        username: config.email,
        password: config.apiToken
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Execute JQL search
   */
  async searchIssues(jql: string, maxResults: number = 50): Promise<JiraSearchResponse> {
    // Check cache first
    const cacheKey = `search:${jql}:${maxResults}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Apply rate limiting
    await this.rateLimiter.consume();

    // Tentar a nova API /rest/api/3/search/jql com POST
    const result = await retryWithBackoff(async () => {
      try {
        const response = await this.client.post('/rest/api/3/search/jql', {
          jql,
          fields: ['summary', 'status', 'priority', 'assignee', 'created', 'updated', 'project', 'issuetype'],
          maxResults
        });
        
        // A nova API retorna uma estrutura diferente
        const data = response.data;
        return {
          issues: data.issues || [],
          total: data.total || data.issues?.length || 0,
          startAt: data.startAt || 0,
          maxResults: data.maxResults || maxResults
        };
      } catch (error: any) {
        // Se a nova API falhar, tentar a API tradicional
        if (error.response?.status === 410 || error.response?.status === 404) {
          const response = await this.client.get('/rest/api/3/search', {
            params: {
              jql,
              fields: 'summary,status,priority,assignee,created,updated,project,issuetype',
              maxResults
            }
          });
          return response.data;
        }
        throw error;
      }
    });

    // Cache the result
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<JiraProject[]> {
    const response = await this.client.get('/rest/api/3/project');
    return response.data;
  }

  /**
   * Add worklog to issue
   */
  async addWorklog(
    issueKey: string,
    timeSpent: string,
    comment?: string
  ): Promise<JiraWorklog> {
    const payload: any = {
      timeSpent
    };

    if (comment) {
      payload.comment = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment
              }
            ]
          }
        ]
      };
    }

    const response = await this.client.post(
      `/rest/api/3/issue/${issueKey}/worklog`,
      payload
    );
    return response.data;
  }

  /**
   * Get worklogs for issue
   */
  async getWorklogs(issueKey: string): Promise<JiraWorklog[]> {
    const response = await this.client.get(
      `/rest/api/3/issue/${issueKey}/worklog`
    );
    return response.data.worklogs || [];
  }

  /**
   * Add comment to issue
   */
  async addComment(issueKey: string, commentText: string): Promise<JiraComment> {
    const payload = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: commentText
              }
            ]
          }
        ]
      }
    };

    const response = await this.client.post(
      `/rest/api/3/issue/${issueKey}/comment`,
      payload
    );
    return response.data;
  }

  /**
   * Get comments for issue
   */
  async getComments(issueKey: string): Promise<JiraComment[]> {
    const response = await this.client.get(
      `/rest/api/3/issue/${issueKey}/comment`
    );
    return response.data.comments || [];
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const response = await this.client.get('/rest/api/3/myself');
    return response.data;
  }

  /**
   * Get project issue types
   */
  async getProjectIssueTypes(projectKey: string) {
    const response = await this.client.get(`/rest/api/3/issue/createmeta/${projectKey}/issuetypes`);
    return response.data.issueTypes || [];
  }

  /**
   * Get issue with all fields (for discovering custom field IDs)
   */
  async getIssueFields(issueKey: string) {
    const response = await this.client.get(`/rest/api/3/issue/${issueKey}`);
    return response.data;
  }

  /**
   * Create a new issue
   */
  async createIssue(params: {
    project: string;
    summary: string;
    description?: string;
    descriptionAdf?: any;
    issueType?: string;
    issueTypeId?: string;
    priority?: string;
    assignee?: string;
    labels?: string[];
    parentKey?: string;
    customFields?: Record<string, any>;
  }) {
    const fields: any = {
      project: {
        key: params.project
      },
      summary: params.summary,
      issuetype: params.issueTypeId 
        ? { id: params.issueTypeId } 
        : { name: params.issueType || 'Task' }
    };

    // Support both plain text description and ADF (Atlassian Document Format)
    if (params.descriptionAdf) {
      fields.description = params.descriptionAdf;
    } else if (params.description) {
      fields.description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: params.description
              }
            ]
          }
        ]
      };
    }

    if (params.priority) {
      fields.priority = {
        name: params.priority
      };
    }

    if (params.assignee) {
      fields.assignee = {
        id: params.assignee
      };
    }

    if (params.labels && params.labels.length > 0) {
      fields.labels = params.labels;
    }

    if (params.parentKey) {
      fields.parent = {
        key: params.parentKey
      };
    }

    // Add custom fields (e.g., customfield_12345)
    if (params.customFields) {
      for (const [key, value] of Object.entries(params.customFields)) {
        fields[key] = value;
      }
    }

    const response = await this.client.post('/rest/api/3/issue', {
      fields
    });
    
    return response.data;
  }

  /**
   * Update an existing issue
   */
  async updateIssue(issueKey: string, params: {
    summary?: string;
    description?: string;
    priority?: string;
    assignee?: string;
    labels?: string[];
  }) {
    const fields: any = {};

    if (params.summary) {
      fields.summary = params.summary;
    }

    if (params.description) {
      fields.description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: params.description
              }
            ]
          }
        ]
      };
    }

    if (params.priority) {
      fields.priority = {
        name: params.priority
      };
    }

    if (params.assignee) {
      fields.assignee = {
        id: params.assignee
      };
    }

    if (params.labels) {
      fields.labels = params.labels;
    }

    const response = await this.client.put(`/rest/api/3/issue/${issueKey}`, {
      fields
    });

    return response.data;
  }

  /**
   * Transition issue to new status
   */
  async transitionIssue(issueKey: string, statusName: string) {
    // Get available transitions
    const transitionsResponse = await this.client.get(
      `/rest/api/3/issue/${issueKey}/transitions`
    );
    
    const transitions = transitionsResponse.data.transitions || [];
    
    // Find transition that matches the status name
    const transition = transitions.find(
      (t: any) => t.to.name.toLowerCase() === statusName.toLowerCase()
    );
    
    if (!transition) {
      const availableStatuses = transitions.map((t: any) => t.to.name).join(', ');
      throw new Error(
        `No transition available to status "${statusName}". Available: ${availableStatuses}`
      );
    }

    // Perform transition
    const response = await this.client.post(
      `/rest/api/3/issue/${issueKey}/transitions`,
      {
        transition: {
          id: transition.id
        }
      }
    );

    return response.data;
  }

  /**
   * Search issues in a specific board
   */
  async searchBoardIssues(boardId: number, jql?: string, maxResults: number = 50): Promise<JiraSearchResponse> {
    const cacheKey = `board_search:${boardId}:${jql || ''}:${maxResults}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    await this.rateLimiter.consume();

    const params: any = {
      maxResults
    };

    if (jql) {
      params.jql = jql;
    }

    const result = await retryWithBackoff(async () => {
      const response = await this.client.get(`${this.config.baseUrl}/rest/agile/1.0/board/${boardId}/issue`, {
        params
      });
      return response;
    });

    // Transform board API response to match search API format
    const transformedResponse = {
      issues: result.data.issues || [],
      total: result.data.total || 0,
      maxResults: result.data.maxResults || maxResults,
      startAt: result.data.startAt || 0
    };

    this.cache.set(cacheKey, transformedResponse);
    return transformedResponse;
  }

  /**
   * Get issue URL for linking
   */
  getIssueUrl(issueKey: string): string {
    return `${this.config.baseUrl}/browse/${issueKey}`;
  }

  /**
   * Get attachments for an issue
   */
  async getAttachments(issueKey: string) {
    const response = await this.client.get(`/rest/api/3/issue/${issueKey}`, {
      params: {
        fields: 'attachment'
      }
    });
    
    return response.data.fields?.attachment || [];
  }

  /**
   * Add attachment to an issue
   */
  async addAttachment(issueKey: string, fileName: string, fileBuffer: Buffer) {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/octet-stream'
    });

    const response = await this.client.post(
      `/rest/api/3/issue/${issueKey}/attachments`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-Atlassian-Token': 'no-check'
        }
      }
    );

    return response.data[0]; // Return first attachment
  }
}
