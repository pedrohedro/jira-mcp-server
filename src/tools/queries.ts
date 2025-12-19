import { z } from 'zod';
import type { JiraClient } from '../jira-client.js';

/**
 * Predefined JQL queries
 */
const PREDEFINED_QUERIES = {
  my_tasks: 'assignee = currentUser() AND resolution = Unresolved ORDER BY priority DESC',
  my_board_tasks: 'assignee = currentUser() AND project = CCOE ORDER BY priority DESC',
  my_subtasks: 'assignee = currentUser() AND issuetype = Sub-task ORDER BY priority DESC',
  sprint_active: 'assignee = currentUser() AND sprint in openSprints() ORDER BY priority DESC',
  in_development: 'assignee = currentUser() AND status = "In Development" ORDER BY updated DESC',
  to_development: 'assignee = currentUser() AND status = "To Development" ORDER BY priority DESC',
  high_priority: 'assignee = currentUser() AND priority IN (Highest, High) AND resolution = Unresolved ORDER BY priority DESC'
};

/**
 * Format issue for display
 */
function formatIssue(issue: any): string {
  const { key, fields } = issue;
  const summary = fields.summary || 'N/A';
  const status = fields.status?.name || 'N/A';
  const priority = fields.priority?.name || 'N/A';
  const assignee = fields.assignee?.displayName || 'Unassigned';
  const updated = fields.updated ? new Date(fields.updated).toLocaleDateString() : 'N/A';

  return `**${key}**: ${summary}
Status: ${status} | Priority: ${priority} | Assignee: ${assignee}
Updated: ${updated}`;
}

/**
 * Query Tools
 */
export function createQueryTools(jiraClient: JiraClient) {
  return {
    list_my_tasks: {
      description: 'List all unresolved tasks assigned to current user',
      inputSchema: z.object({
        maxResults: z.number().optional().default(50).describe('Maximum number of results to return')
      }),
      handler: async (args: { maxResults?: number }) => {
        try {
          const result = await jiraClient.searchIssues(
            PREDEFINED_QUERIES.my_tasks,
            args.maxResults
          );

          if (result.issues.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: '📋 No tasks found'
              }]
            };
          }

          const formatted = result.issues.map(formatIssue).join('\n\n');
          return {
            content: [{
              type: 'text' as const,
              text: `📋 Found ${result.total} tasks:\n\n${formatted}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    },

    list_my_board_tasks: {
      description: 'List all tasks assigned to current user in CCOE project board (Atlantis P&D) - Use terminal commands for board-specific searches',
      inputSchema: z.object({
        maxResults: z.number().optional().default(50).describe('Maximum number of results to return')
      }),
      handler: async (args: { maxResults?: number }) => {
        try {
          // First try standard API
          const response = await jiraClient.searchIssues('assignee=currentUser() ORDER BY updated DESC', args.maxResults || 10);

          if (response.issues && response.issues.length > 0) {
            const formatted = response.issues.map(formatIssue).join('\n\n');
            return {
              content: [{
                type: 'text' as const,
                text: `📋 Found ${response.total} tasks:\n\n${formatted}`
              }]
            };
          } else {
            // No issues found - provide board-specific instructions
            return {
              content: [{
                type: 'text' as const,
                text: `📋 Suas tarefas no Jira (0 encontradas com assignee=currentUser())

💡 Dica: Suas tarefas podem estar em um board específico (CCOE - Atlantis P&D).

🔧 **Para consultar o board 1720 diretamente, execute no terminal:**

\`\`\`bash
curl -u "$JIRA_EMAIL:$JIRA_API_TOKEN" "https://clarodigital.atlassian.net/rest/agile/1.0/board/1720/issue?maxResults=20"
\`\`\`

🌐 **Ou acesse diretamente no navegador:**
https://clarodigital.atlassian.net/secure/RapidBoard.jspa?rapidView=1720

📝 **Script helper disponível:**
Execute \`node scripts/get-board-tasks.mjs\` neste diretório para uma consulta automatizada.`
              }]
            };
          }
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Erro ao buscar tarefas: ${error.message}

💡 **Solução alternativa - use o terminal:**

\`\`\`bash
curl -u "$JIRA_EMAIL:$JIRA_API_TOKEN" "https://clarodigital.atlassian.net/rest/agile/1.0/board/1720/issue?maxResults=20"
\`\`\`

Ou execute: \`node scripts/get-board-tasks.mjs\``
            }],
            isError: true
          };
        }
      }
    },

    list_subtasks: {
      description: 'List all subtasks assigned to current user',
      inputSchema: z.object({
        status: z.enum(['all', 'In Development', 'To Development']).optional().default('all').describe('Filter by status'),
        sprint: z.boolean().optional().default(true).describe('Only show sprint subtasks')
      }),
      handler: async (args: { status?: string; sprint?: boolean }) => {
        try {
          let jql = PREDEFINED_QUERIES.my_subtasks;

          if (args.sprint) {
            jql = jql.replace('issuetype = Sub-task', 'issuetype = Sub-task AND sprint in openSprints()');
          }

          if (args.status && args.status !== 'all') {
            jql = jql.replace('ORDER BY', `AND status = "${args.status}" ORDER BY`);
          }

          const result = await jiraClient.searchIssues(jql, 50);

          if (result.issues.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: '📋 No subtasks found'
              }]
            };
          }

          const formatted = result.issues.map(formatIssue).join('\n\n');
          return {
            content: [{
              type: 'text' as const,
              text: `📋 Found ${result.total} subtasks:\n\n${formatted}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    },

    list_sprint_active: {
      description: 'List all tasks in active sprint assigned to current user',
      inputSchema: z.object({
        maxResults: z.number().optional().default(50)
      }),
      handler: async (args: { maxResults?: number }) => {
        try {
          const result = await jiraClient.searchIssues(
            PREDEFINED_QUERIES.sprint_active,
            args.maxResults
          );

          if (result.issues.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: '📋 No tasks in active sprint'
              }]
            };
          }

          const formatted = result.issues.map(formatIssue).join('\n\n');
          return {
            content: [{
              type: 'text' as const,
              text: `🏃 Found ${result.total} tasks in active sprint:\n\n${formatted}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    },

    list_in_development: {
      description: 'List tasks currently in development',
      inputSchema: z.object({
        maxResults: z.number().optional().default(50)
      }),
      handler: async (args: { maxResults?: number }) => {
        try {
          const result = await jiraClient.searchIssues(
            PREDEFINED_QUERIES.in_development,
            args.maxResults
          );

          if (result.issues.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: '📋 No tasks in development'
              }]
            };
          }

          const formatted = result.issues.map(formatIssue).join('\n\n');
          return {
            content: [{
              type: 'text' as const,
              text: `🟢 Found ${result.total} tasks in development:\n\n${formatted}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    },

    list_projects: {
      description: 'List all available Jira projects',
      inputSchema: z.object({}),
      handler: async () => {
        try {
          const projects = await jiraClient.getProjects();

          if (projects.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: '📋 No projects found'
              }]
            };
          }

          const formatted = projects.map(p =>
            `**${p.key}**: ${p.name} (${p.projectTypeKey})`
          ).join('\n');

          return {
            content: [{
              type: 'text' as const,
              text: `📁 Found ${projects.length} projects:\n\n${formatted}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error: ${error.message}`
            }],
            isError: true
          };
        }
      }
    },

    custom_query: {
      description: 'Execute custom JQL query',
      inputSchema: z.object({
        jql: z.string().describe('JQL query string'),
        maxResults: z.number().optional().default(50).describe('Maximum number of results')
      }),
      handler: async (args: { jql: string; maxResults?: number }) => {
        try {
          const result = await jiraClient.searchIssues(args.jql, args.maxResults);

          if (result.issues.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: '📋 No issues found for query'
              }]
            };
          }

          const formatted = result.issues.map(formatIssue).join('\n\n');
          return {
            content: [{
              type: 'text' as const,
              text: `🔍 Found ${result.total} issues:\n\n${formatted}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error executing query: ${error.message}`
            }],
            isError: true
          };
        }
      }
    }
  };
}
