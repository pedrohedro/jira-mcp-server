import { z } from 'zod';
import type { JiraClient } from '../jira-client.js';

/**
 * Issue Management Tools
 */
export function createIssueManagementTools(jiraClient: JiraClient) {
  return {
    create_issue: {
      description: 'Create a new Jira issue with specified fields',
      inputSchema: z.object({
        project: z.string().describe('Project key (e.g., CCOE)'),
        summary: z.string().describe('Issue summary/title'),
        description: z.string().optional().describe('Detailed description of the issue'),
        issueType: z.string().default('Task').describe('Issue type: Task, Bug, Story, Sub-task, etc.'),
        priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional().describe('Issue priority'),
        assignee: z.string().optional().describe('Assignee account ID or email (leave empty for unassigned)'),
        labels: z.array(z.string()).optional().describe('Array of labels to add to the issue'),
        parentKey: z.string().optional().describe('Parent issue key (required for Sub-tasks)')
      }),
      handler: async (args: {
        project: string;
        summary: string;
        description?: string;
        issueType?: string;
        priority?: string;
        assignee?: string;
        labels?: string[];
        parentKey?: string;
      }) => {
        try {
          const issue = await jiraClient.createIssue(args);

          return {
            content: [{
              type: 'text' as const,
              text: `✅ **Issue created successfully!**

**Key**: ${issue.key}
**Summary**: ${args.summary}
**Type**: ${args.issueType}
**Project**: ${args.project}
${args.priority ? `**Priority**: ${args.priority}` : ''}

🔗 View issue: ${jiraClient.getIssueUrl(issue.key)}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ **Failed to create issue**

**Error**: ${error.message}

**Troubleshooting**:
- Verify the project key exists and you have permission to create issues
- Check that the issue type is valid for this project
- If creating a Sub-task, ensure the parent issue key is valid
- Verify the assignee exists in the system`
            }],
            isError: true
          };
        }
      }
    },

    update_issue_status: {
      description: 'Update the status of a Jira issue (transition workflow)',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key (e.g., CCOE-12345)'),
        status: z.string().describe('Target status name (e.g., "In Development", "Done", "To Development")')
      }),
      handler: async (args: { issueKey: string; status: string }) => {
        try {
          await jiraClient.transitionIssue(args.issueKey, args.status);

          return {
            content: [{
              type: 'text' as const,
              text: `✅ **Status updated successfully!**

**Issue**: ${args.issueKey}
**New Status**: ${args.status}

🔗 View issue: ${jiraClient.getIssueUrl(args.issueKey)}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ **Failed to update status**

**Issue**: ${args.issueKey}
**Target Status**: ${args.status}
**Error**: ${error.message}

**Troubleshooting**:
- Verify the issue key is correct
- Check that the target status exists in the workflow
- Ensure the transition is valid from the current status
- Confirm you have permission to transition this issue`
            }],
            isError: true
          };
        }
      }
    },

    update_issue: {
      description: 'Update fields of an existing Jira issue',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key (e.g., CCOE-12345)'),
        summary: z.string().optional().describe('New summary/title'),
        description: z.string().optional().describe('New description'),
        priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional().describe('New priority'),
        assignee: z.string().optional().describe('New assignee account ID or email'),
        labels: z.array(z.string()).optional().describe('Array of labels (replaces existing)')
      }),
      handler: async (args: {
        issueKey: string;
        summary?: string;
        description?: string;
        priority?: string;
        assignee?: string;
        labels?: string[];
      }) => {
        try {
          await jiraClient.updateIssue(args.issueKey, {
            summary: args.summary,
            description: args.description,
            priority: args.priority,
            assignee: args.assignee,
            labels: args.labels
          });

          const updatedFields = Object.keys(args).filter(k => k !== 'issueKey' && args[k as keyof typeof args] !== undefined);

          return {
            content: [{
              type: 'text' as const,
              text: `✅ **Issue updated successfully!**

**Issue**: ${args.issueKey}
**Updated Fields**: ${updatedFields.join(', ')}

🔗 View issue: ${jiraClient.getIssueUrl(args.issueKey)}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ **Failed to update issue**

**Issue**: ${args.issueKey}
**Error**: ${error.message}

**Troubleshooting**:
- Verify the issue key is correct
- Check that you have permission to edit this issue
- Ensure the assignee exists if provided`
            }],
            isError: true
          };
        }
      }
    }
  };
}
