/**
 * Jira API Types
 */

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    project: {
      key: string;
      name: string;
    };
    issuetype: {
      name: string;
    };
  };
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  startAt: number;
  maxResults: number;
}

export interface JiraWorklog {
  id: string;
  author: {
    displayName: string;
    emailAddress: string;
  };
  timeSpent: string;
  timeSpentSeconds: number;
  started: string;
  comment?: {
    content: any[];
  };
}

export interface JiraComment {
  id: string;
  author: {
    displayName: string;
    emailAddress: string;
  };
  body: {
    content: any[];
  };
  created: string;
  updated: string;
}

export interface JiraProject {
  key: string;
  name: string;
  projectTypeKey: string;
}
