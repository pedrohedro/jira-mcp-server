import { z } from 'zod';
import type { JiraClient } from '../jira-client.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Attachment Tools
 */
export function createAttachmentTools(jiraClient: JiraClient) {
  return {
    list_attachments: {
      description: 'List all attachments for a Jira issue',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key (e.g., CCOE-12345)')
      }),
      handler: async (args: { issueKey: string }) => {
        try {
          const attachments = await jiraClient.getAttachments(args.issueKey);

          if (attachments.length === 0) {
            return {
              content: [{
                type: 'text' as const,
                text: `📎 **No attachments found for ${args.issueKey}**`
              }]
            };
          }

          const attachmentList = attachments
            .map((att: any) => {
              const size = (att.size / 1024).toFixed(2);
              return `- **${att.filename}** (${size} KB)\n  Created: ${new Date(att.created).toLocaleString()}\n  By: ${att.author.displayName}\n  🔗 [Download](${att.content})`;
            })
            .join('\n\n');

          return {
            content: [{
              type: 'text' as const,
              text: `📎 **Attachments for ${args.issueKey}**\n\n${attachmentList}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ **Failed to list attachments**\n\n**Error**: ${error.message}`
            }],
            isError: true
          };
        }
      }
    },

    add_attachment: {
      description: 'Add attachment to a Jira issue (provide file path)',
      inputSchema: z.object({
        issueKey: z.string().describe('Issue key (e.g., CCOE-12345)'),
        filePath: z.string().describe('Absolute path to the file to attach')
      }),
      handler: async (args: { issueKey: string; filePath: string }) => {
        try {
          // Verify file exists
          await fs.access(args.filePath);
          
          const fileName = path.basename(args.filePath);
          const fileBuffer = await fs.readFile(args.filePath);

          const result = await jiraClient.addAttachment(
            args.issueKey,
            fileName,
            fileBuffer
          );

          return {
            content: [{
              type: 'text' as const,
              text: `✅ **Attachment added successfully!**

**Issue**: ${args.issueKey}
**File**: ${fileName}
**Size**: ${(result.size / 1024).toFixed(2)} KB

🔗 View issue: ${jiraClient.getIssueUrl(args.issueKey)}`
            }]
          };
        } catch (error: any) {
          return {
            content: [{
              type: 'text' as const,
              text: `❌ **Failed to add attachment**

**Issue**: ${args.issueKey}
**File**: ${args.filePath}
**Error**: ${error.message}

**Troubleshooting**:
- Verify the file path is correct and accessible
- Check that the file size is within Jira's limits
- Ensure you have permission to attach files to this issue`
            }],
            isError: true
          };
        }
      }
    }
  };
}
