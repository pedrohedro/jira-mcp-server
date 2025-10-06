import { z } from 'zod';
import type { JiraClient } from '../jira-client.js';

/**
 * Extract comment text from Jira comment object
 */
function extractCommentText(commentObj: any): string {
  if (!commentObj || !commentObj.content) return 'N/A';

  try {
    const content = commentObj.content;
    if (content && content.length > 0) {
      const paragraphs = content[0].content;
      if (paragraphs && paragraphs.length > 0) {
        return paragraphs[0].text || 'N/A';
      }
    }
  } catch (e) {
    return 'N/A';
  }

  return 'N/A';
}

/**
 * Worklog Tools
 */
export function createWorklogTools(jiraClient: JiraClient) {
  return {
    add_worklog: {
      description: 'Add time log (worklog) to an issue or subtask',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key (e.g., CCOE-12345)'),
        timeSpent: z.string().describe('Time spent in Jira format (e.g., "2h 30m", "1d", "3h")'),
        comment: z.string().optional().describe('Optional comment for the worklog')
      }),
      handler: async (args: { issueKey: string; timeSpent: string; comment?: string }) => {
        try {
          const worklog = await jiraClient.addWorklog(
            args.issueKey,
            args.timeSpent,
            args.comment
          );

          const timeSpentStr = worklog.timeSpent || 'N/A';
          const timeSpentSeconds = worklog.timeSpentSeconds || 0;
          const hours = Math.floor(timeSpentSeconds / 3600);
          const minutes = Math.floor((timeSpentSeconds % 3600) / 60);

          let response = `✅ Worklog added successfully to **${args.issueKey}**\n`;
          response += `⏱️  Time logged: ${timeSpentStr} (${hours}h ${minutes}m)\n`;

          if (args.comment) {
            response += `💬 Comment: ${args.comment}`;
          }

          return {
            content: [{
              type: 'text' as const,
              text: response
            }]
          };
        } catch (error: any) {
          let errorMsg = error.message;

          if (error.response?.status === 404) {
            errorMsg = `Issue ${args.issueKey} not found`;
          } else if (error.response?.status === 400) {
            errorMsg = `Invalid time format: ${args.timeSpent}. Use format like "2h 30m", "1d", "3h"`;
          }

          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error adding worklog: ${errorMsg}`
            }],
            isError: true
          };
        }
      }
    },

    list_worklogs: {
      description: 'List all worklogs for an issue',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key (e.g., CCOE-12345)')
      }),
      handler: async (args: { issueKey: string }) => {
        try {
          const worklogs = await jiraClient.getWorklogs(args.issueKey);

          if (worklogs.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: `📊 No worklogs found for ${args.issueKey}`
              }]
            };
          }

          // Format worklogs
          const formatted = worklogs.map((w, idx) => {
            const author = w.author?.displayName || 'Unknown';
            const timeSpent = w.timeSpent || 'N/A';
            const started = w.started ? new Date(w.started).toLocaleDateString() : 'N/A';
            const comment = w.comment ? extractCommentText(w.comment) : 'No comment';

            return `${idx + 1}. **${author}** - ${timeSpent} (${started})
   Comment: ${comment}`;
          }).join('\n\n');

          // Calculate total time
          const totalSeconds = worklogs.reduce((sum, w) => sum + (w.timeSpentSeconds || 0), 0);
          const totalHours = Math.floor(totalSeconds / 3600);
          const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

          let response = `📊 Worklogs for **${args.issueKey}** (${worklogs.length} entries):\n\n`;
          response += formatted;
          response += `\n\n⏱️  **Total time logged**: ${totalHours}h ${totalMinutes}m`;

          return {
            content: [{
              type: 'text' as const,
              text: response
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error fetching worklogs: ${error.message}`
            }],
            isError: true
          };
        }
      }
    }
  };
}
