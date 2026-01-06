import { z } from 'zod';
import type { JiraClient } from '../jira-client.js';

/**
 * Issue Management Tools
 * 
 * ============================================================================
 * CCOE PROJECT - REQUIRED FIELDS REFERENCE (discovered via createmeta API)
 * ============================================================================
 * 
 * HISTÓRIA (issueTypeId: "10001"):
 * ---------------------------------
 * Required fields:
 *   - project: { key: "CCOE" }
 *   - summary: "Issue title"
 *   - issuetype: { id: "10001" }
 *   - customfield_11216 (3F): { id: "VALUE" }
 *       Options:
 *         - "16740" = Feature | Nova Implementação
 *         - "16741" = Feature | Melhoria
 *         - "13157" = Foundation
 *         - "13158" = Fix
 *         - "15745" = Outros
 *   - customfield_12171 (Tipo): { id: "VALUE" }
 *       Common options:
 *         - "21718" = Padronização esteiras
 *         - "21715" = Desenvolvimento de padrão de esteiras
 *         - "21712" = Desenvolvimento de padrão de módulos terraform
 *         - "21721" = Desenvolvimento de aplicações
 *         - "21481" = Documentação
 *         - "15745" = Outros (in customfield_11216)
 * 
 * SUBTAREFA (issueTypeId: "10007"):
 * ---------------------------------
 * Required fields:
 *   - project: { key: "CCOE" }
 *   - summary: "Subtask title"
 *   - issuetype: { id: "10007" }
 *   - parent: { key: "CCOE-XXXXX" }
 * 
 * Optional but recommended:
 *   - customfield_10018 (Sprint): [{ id: SPRINT_ID }]
 *       Example: [{ id: 12399 }] = Q1 - Sprint 35
 *   - customfield_12124 (Team): { id: "18129" } = Atlantis United P&D
 * 
 * TAREFA (issueTypeId: "10006"):
 * ---------------------------------
 * Similar to História, check createmeta for specifics.
 * 
 * ============================================================================
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
      description: `Create a new Jira issue with specified fields. 
For CCOE project, required fields (3F and Tipo) are auto-filled with defaults if not provided.
Use ccoe3F and ccoeType parameters for easy selection, or customFields for full control.`,
      inputSchema: z.object({
        project: z.string().describe('Project key (e.g., CCOE)'),
        summary: z.string().describe('Issue summary/title'),
        description: z.string().optional().describe('Detailed description of the issue (plain text)'),
        descriptionAdf: z.any().optional().describe('Description in Atlassian Document Format (ADF) for rich formatting'),
        issueType: z.string().default('Task').describe('Issue type name: Task, Bug, Story, História, Subtarefa, etc.'),
        issueTypeId: z.string().optional().describe('Issue type ID (use instead of issueType for reliability, e.g., "10001" for História, "10007" for Subtarefa)'),
        priority: z.enum(['Highest', 'High', 'Medium', 'Low', 'Lowest']).optional().describe('Issue priority'),
        assignee: z.string().optional().describe('Assignee account ID (leave empty for unassigned)'),
        labels: z.array(z.string()).optional().describe('Array of labels to add to the issue'),
        parentKey: z.string().optional().describe('Parent issue key (required for Sub-tasks)'),
        // CCOE-specific helper fields
        ccoe3F: z.enum(['feature-nova', 'feature-melhoria', 'foundation', 'fix', 'outros']).optional()
          .describe('CCOE 3F field shortcut: feature-nova, feature-melhoria, foundation, fix, outros'),
        ccoeType: z.enum([
          'padronizacao-esteiras', 'dev-esteiras', 'dev-terraform', 'dev-aplicacoes', 
          'documentacao', 'sustentacao-devops', 'devops-cicd', 'outros'
        ]).optional()
          .describe('CCOE Tipo field shortcut: padronizacao-esteiras, dev-esteiras, dev-terraform, dev-aplicacoes, documentacao, sustentacao-devops, devops-cicd, outros'),
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
        ccoe3F?: string;
        ccoeType?: string;
        customFields?: Record<string, any>;
      }) => {
        try {
          // CCOE Required Fields Mapping
          const CCOE_3F_MAP: Record<string, string> = {
            'feature-nova': '16740',
            'feature-melhoria': '16741',
            'foundation': '13157',
            'fix': '13158',
            'outros': '15745'
          };
          
          const CCOE_TYPE_MAP: Record<string, string> = {
            'padronizacao-esteiras': '21718',
            'dev-esteiras': '21715',
            'dev-terraform': '21712',
            'dev-aplicacoes': '21721',
            'documentacao': '21481',
            'sustentacao-devops': '21720',
            'devops-cicd': '22806',
            'outros': '15745'
          };

          // Build custom fields with CCOE defaults for História
          let finalCustomFields = { ...args.customFields };
          
          if (args.project === 'CCOE') {
            const isHistoria = args.issueTypeId === '10001' || 
                             args.issueType?.toLowerCase() === 'história' || 
                             args.issueType?.toLowerCase() === 'story';
            const isSubtarefa = args.issueTypeId === '10007' || 
                               args.issueType?.toLowerCase() === 'subtarefa' ||
                               args.issueType?.toLowerCase() === 'sub-task' ||
                               args.parentKey;

            // For História, add required fields if not provided
            if (isHistoria && !isSubtarefa) {
              // 3F field (customfield_11216)
              if (!finalCustomFields['customfield_11216']) {
                const ccoe3FValue = args.ccoe3F ? CCOE_3F_MAP[args.ccoe3F] : '15745'; // default: outros
                finalCustomFields['customfield_11216'] = { id: ccoe3FValue };
              }
              
              // Tipo field (customfield_12171)
              if (!finalCustomFields['customfield_12171']) {
                const ccoeTypeValue = args.ccoeType ? CCOE_TYPE_MAP[args.ccoeType] : '21718'; // default: padronizacao-esteiras
                finalCustomFields['customfield_12171'] = { id: ccoeTypeValue };
              }
            }
          }

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
            customFields: Object.keys(finalCustomFields).length > 0 ? finalCustomFields : undefined
          });

          // Build custom fields info for output
          const customFieldsInfo = Object.keys(finalCustomFields).length > 0 
            ? `**Custom Fields**: ${Object.entries(finalCustomFields).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}`
            : '';

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
${customFieldsInfo}

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
