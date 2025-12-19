import { z } from 'zod';
import type { JiraClient } from '../jira-client.js';

/**
 * Issue Management Tools
 */
export function createIssueManagementTools(jiraClient: JiraClient) {
  return {
    get_project_issue_types: {
      description: 'Get available issue types for a project (useful for finding issue type IDs)',
      inputSchema: z.object({
        project: z.string().describe('Project key (e.g., CCOE)')
      }),
      handler: async (args: { project: string }) => {
        try {
          const issueTypes = await jiraClient.getProjectIssueTypes(args.project);
          
          const typesList = issueTypes.map((t: any) => 
            `- **${t.name}** (ID: ${t.id}) ${t.subtask ? '[Subtask]' : ''}`
          ).join('\n');

          return {
            content: [{
              type: 'text' as const,
              text: `📋 **Issue Types for ${args.project}**\n\n${typesList}\n\n💡 Use the ID when creating subtasks (issueTypeId parameter)`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ **Failed to get issue types**\n\n**Error**: ${error.message}`
            }],
            isError: true
          };
        }
      }
    },

    get_issue_custom_fields: {
      description: 'Get custom field values from an existing issue (useful for discovering field IDs)',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key to inspect (e.g., CCOE-12345)')
      }),
      handler: async (args: { issueKey: string }) => {
        try {
          const issue = await jiraClient.getIssueFields(args.issueKey);
          
          const customFields = Object.entries(issue.fields)
            .filter(([key, value]) => key.startsWith('customfield_') && value !== null)
            .map(([key, value]) => {
              let displayValue = '';
              if (typeof value === 'object' && value !== null) {
                if ('value' in (value as any)) {
                  displayValue = `{id: "${(value as any).id}", value: "${(value as any).value}"}`;
                } else {
                  displayValue = JSON.stringify(value).substring(0, 100);
                }
              } else {
                displayValue = String(value);
              }
              return `- **${key}**: ${displayValue}`;
            })
            .join('\n');

          return {
            content: [{
              type: 'text' as const,
              text: `🔍 **Custom Fields in ${args.issueKey}**\n\n${customFields || 'No custom fields with values found'}\n\n💡 Copy the field ID (customfield_XXXXX) to use in create_issue`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ **Failed to get issue fields**\n\n**Error**: ${error.message}`
            }],
            isError: true
          };
        }
      }
    },

    create_issue: {
      description: 'Create a new Jira issue with specified fields',
      inputSchema: z.object({
        project: z.string().describe('Project key (e.g., CCOE)'),
        summary: z.string().describe('Issue summary/title'),
        description: z.string().optional().describe('Detailed description of the issue (plain text)'),
        descriptionAdf: z.any().optional().describe('Description in Atlassian Document Format (ADF) for rich formatting'),
        issueType: z.string().default('Task').describe('Issue type name: Task, Bug, Story, História, Subtarefa, etc.'),
        issueTypeId: z.string().optional().describe('Issue type ID (use instead of issueType for reliability, e.g., "10007" for Subtarefa)'),
        priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional().describe('Issue priority'),
        assignee: z.string().optional().describe('Assignee account ID (leave empty for unassigned)'),
        labels: z.array(z.string()).optional().describe('Array of labels to add to the issue'),
        parentKey: z.string().optional().describe('Parent issue key (required for Sub-tasks)'),
        customFields: z.record(z.string(), z.any()).optional().describe('Custom fields as key-value pairs. For select fields use {"id": "OPTION_ID"}, e.g., {"customfield_12171": {"id": "21743"}}')
      }),
      handler: async (args: {
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
      }) => {
        try {
          // First validate that the project exists and user has access
          const projects = await jiraClient.getProjects();
          const projectExists = projects.some(p => p.key === args.project);

          if (!projectExists) {
            const availableProjects = projects.map(p => `${p.key} (${p.name})`).join(', ');
            return {
              content: [{
                type: 'text' as const,
                text: `❌ **Cannot create issue**

**Error**: Project "${args.project}" not found or you don't have access to it.

**Available projects you can access**: ${availableProjects || 'None'}

**Troubleshooting**:
- Verify the project key is correct (case-sensitive)
- Check that you have permission to access this project
- Contact your Jira administrator if you need access to additional projects`
              }],
              isError: true
            };
          }

          const issue = await jiraClient.createIssue({
            project: args.project,
            summary: args.summary,
            description: args.description,
            descriptionAdf: args.descriptionAdf,
            issueType: args.issueType,
            issueTypeId: args.issueTypeId,
            priority: args.priority,
            assignee: args.assignee,
            labels: args.labels,
            parentKey: args.parentKey,
            customFields: args.customFields
          });

          return {
            content: [{
              type: 'text' as const,
              text: `✅ **Issue created successfully!**

**Key**: ${issue.key}
**Summary**: ${args.summary}
**Type**: ${args.issueTypeId || args.issueType}
**Project**: ${args.project}
${args.priority ? `**Priority**: ${args.priority}` : ''}
${args.parentKey ? `**Parent**: ${args.parentKey}` : ''}
${args.customFields ? `**Custom Fields**: ${Object.keys(args.customFields).join(', ')}` : ''}

🔗 View issue: ${jiraClient.getIssueUrl(issue.key)}`
            }]
          };
        } catch (error: any) {
          // Handle specific error cases
          if (error.response?.status === 403 || error.message?.includes('permission')) {
            return {
              content: [{
                type: 'text' as const,
                text: `❌ **Cannot create issue**

**Error**: You don't have permission to create issues in project "${args.project}"

**Troubleshooting**:
- Verify you have "Create Issues" permission in this project
- Check if the issue type "${args.issueType}" is allowed in this project
- Contact your project administrator for the required permissions`
              }],
              isError: true
            };
          }

          if (error.response?.status === 400) {
            return {
              content: [{
                type: 'text' as const,
                text: `❌ **Invalid issue data**

**Error**: ${error.response?.data?.errorMessages?.join(', ') || error.message}

**Troubleshooting**:
- Check that all required fields are provided
- Verify the issue type is valid for this project
- Ensure the assignee exists and is valid
- If creating a Sub-task, verify the parent issue exists`
              }],
              isError: true
            };
          }

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
