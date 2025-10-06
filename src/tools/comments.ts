import { z } from 'zod';
import type { JiraClient } from '../jira-client.js';

/**
 * Extract comment text from Jira comment object
 */
function extractCommentText(body: any): string {
  if (!body || !body.content) return 'N/A';

  try {
    const content = body.content;
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
 * Comment Tools
 */
export function createCommentTools(jiraClient: JiraClient) {
  return {
    add_comment: {
      description: 'Add a comment to an issue or subtask for traceability',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key (e.g., CCOE-12345)'),
        commentText: z.string().describe('Comment text to add')
      }),
      handler: async (args: { issueKey: string; commentText: string }) => {
        try {
          const comment = await jiraClient.addComment(args.issueKey, args.commentText);

          const author = comment.author?.displayName || 'You';
          const created = comment.created ? new Date(comment.created).toLocaleDateString() : 'now';
          const preview = args.commentText.length > 100
            ? args.commentText.substring(0, 100) + '...'
            : args.commentText;

          let response = `✅ Comment added successfully to **${args.issueKey}**\n`;
          response += `👤 Author: ${author}\n`;
          response += `📅 Created: ${created}\n`;
          response += `💬 Comment: ${preview}`;

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
          }

          return {
            content: [{
              type: 'text' as const,
              text: `❌ Error adding comment: ${errorMsg}`
            }],
            isError: true
          };
        }
      }
    },

    list_comments: {
      description: 'List all comments for an issue',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key (e.g., CCOE-12345)')
      }),
      handler: async (args: { issueKey: string }) => {
        try {
          const comments = await jiraClient.getComments(args.issueKey);

          if (comments.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: `💬 No comments found for ${args.issueKey}`
              }]
            };
          }

          // Format comments
          const formatted = comments.map((c, idx) => {
            const author = c.author?.displayName || 'Unknown';
            const created = c.created ? new Date(c.created).toLocaleDateString() : 'N/A';
            const commentText = extractCommentText(c.body);
            const preview = commentText.length > 200
              ? commentText.substring(0, 200) + '...'
              : commentText;

            return `${idx + 1}. **${author}** (${created})
   ${preview}`;
          }).join('\n\n');

          let response = `💬 Comments for **${args.issueKey}** (${comments.length} total):\n\n`;
          response += formatted;

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
              text: `❌ Error fetching comments: ${error.message}`
            }],
            isError: true
          };
        }
      }
    }
  };
}
