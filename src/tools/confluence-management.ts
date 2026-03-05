import { z } from 'zod';
import type { ConfluenceClient } from '../confluence-client.js';

export function createConfluenceManagementTools(confluenceClient: ConfluenceClient) {
    return {
        search_confluence: {
            description: 'Search Confluence pages using CQL (Confluence Query Language)',
            inputSchema: z.object({
                cql: z.string().describe('CQL query string (e.g., text ~ "supergraph" or space = "CCOE")'),
                limit: z.number().optional().default(25).describe('Maximum number of results to return')
            }),
            handler: async (args: { cql: string; limit?: number }) => {
                try {
                    const result = await confluenceClient.search(args.cql, args.limit);
                    const results = result.results.map((r: any) =>
                        `- **${r.title}** (ID: ${r.content?.id || r.id}, Space: ${r.resultGlobalContainer?.title || 'Unknown'}) \n  🔗 ${confluenceClient.getPageUrl(r.url || r._links?.webui)}`
                    ).join('\n');

                    return {
                        content: [{
                            type: 'text' as const,
                            text: `🔍 **Confluence Search Results**\n\nTotal found: ${result.totalSize || result.results.length}\n\n${results || 'No results found.'}`
                        }]
                    };
                } catch (error: any) {
                    return {
                        content: [{
                            type: 'text' as const,
                            text: `❌ **Failed to search Confluence**\n\n**Error**: ${error.message}`
                        }],
                        isError: true
                    };
                }
            }
        },

        get_confluence_page: {
            description: 'Get the content of a Confluence page by ID',
            inputSchema: z.object({
                pageId: z.string().describe('Confluence page ID')
            }),
            handler: async (args: { pageId: string }) => {
                try {
                    const page = await confluenceClient.getPage(args.pageId);

                    return {
                        content: [{
                            type: 'text' as const,
                            text: `📄 **${page.title}** (Space: ${page.space?.name || 'Unknown'}, Version: ${page.version?.number || 1})\n\n🔗 ${confluenceClient.getPageUrl(page._links?.webui)}\n\n**Content**:\n${page.body?.storage?.value || 'No content found.'}`
                        }]
                    };
                } catch (error: any) {
                    return {
                        content: [{
                            type: 'text' as const,
                            text: `❌ **Failed to get Confluence page**\n\n**Error**: ${error.message}`
                        }],
                        isError: true
                    };
                }
            }
        },

        create_confluence_page: {
            description: 'Create a new Confluence page in a specific space',
            inputSchema: z.object({
                spaceKey: z.string().describe('Key of the space where the page will be created (e.g., CCOE)'),
                title: z.string().describe('Title of the new page'),
                body: z.string().describe('Content of the page in Atlassian Storage Format (XHTML) or plain text'),
                parentId: z.string().optional().describe('Optional ID of the parent page to create under')
            }),
            handler: async (args: { spaceKey: string; title: string; body: string; parentId?: string }) => {
                try {
                    const page = await confluenceClient.createPage(args);

                    return {
                        content: [{
                            type: 'text' as const,
                            text: `✅ **Confluence page created successfully!**\n\n**Title**: ${page.title}\n**ID**: ${page.id}\n**Space**: ${args.spaceKey}\n\n🔗 View page: ${confluenceClient.getPageUrl(page._links?.webui)}`
                        }]
                    };
                } catch (error: any) {
                    return {
                        content: [{
                            type: 'text' as const,
                            text: `❌ **Failed to create Confluence page**\n\n**Error**: ${error.response?.data?.message || error.message}`
                        }],
                        isError: true
                    };
                }
            }
        },

        update_confluence_page: {
            description: 'Update the content of an existing Confluence page',
            inputSchema: z.object({
                pageId: z.string().describe('The ID of the page to update'),
                title: z.string().describe('The new title for the page'),
                body: z.string().describe('The new content of the page in Atlassian Storage Format (XHTML) or plain text'),
                versionNumber: z.number().describe('The new version number (must be current version + 1)')
            }),
            handler: async (args: { pageId: string; title: string; body: string; versionNumber: number }) => {
                try {
                    const page = await confluenceClient.updatePage(args);

                    return {
                        content: [{
                            type: 'text' as const,
                            text: `✅ **Confluence page updated successfully!**\n\n**Title**: ${page.title}\n**New Version**: ${page.version?.number}\n**ID**: ${page.id}\n\n🔗 View page: ${confluenceClient.getPageUrl(page._links?.webui)}`
                        }]
                    };
                } catch (error: any) {
                    return {
                        content: [{
                            type: 'text' as const,
                            text: `❌ **Failed to update Confluence page**\n\n**Error**: ${error.response?.data?.message || error.message}\n\n💡 Make sure you provided the correct new versionNumber (+1 from current version).`
                        }],
                        isError: true
                    };
                }
            }
        }
    };
}
