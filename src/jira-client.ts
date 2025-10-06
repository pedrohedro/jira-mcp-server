import axios, { AxiosInstance } from 'axios';
import type {
  JiraConfig,
  JiraSearchResponse,
  JiraWorklog,
  JiraComment,
  JiraProject
} from './types/jira.js';

export class JiraClient {
  private client: AxiosInstance;
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
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
    const response = await this.client.get('/rest/api/3/search/jql', {
      params: {
        jql,
        fields: 'summary,status,priority,assignee,created,updated,project,issuetype',
        maxResults
      }
    });
    return response.data;
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
}
