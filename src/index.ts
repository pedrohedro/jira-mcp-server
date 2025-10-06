#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { JiraClient } from './jira-client.js';
import { createQueryTools } from './tools/queries.js';
import { createWorklogTools } from './tools/worklog.js';
import { createCommentTools } from './tools/comments.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} environment variable is required`);
    process.exit(1);
  }
}

// Initialize Jira client
const jiraClient = new JiraClient({
  baseUrl: process.env.JIRA_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!
});

// Create all tools
const queryTools = createQueryTools(jiraClient);
const worklogTools = createWorklogTools(jiraClient);
const commentTools = createCommentTools(jiraClient);

// Combine all tools
const allTools = {
  ...queryTools,
  ...worklogTools,
  ...commentTools
};

// Create MCP server
const server = new Server(
  {
    name: 'jira-mcp-server',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Register list_tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(allTools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: Object.fromEntries(
          Object.entries(tool.inputSchema.shape).map(([key, value]: [string, any]) => [
            key,
            {
              type: typeof value._def.typeName === 'string' ? value._def.typeName.toLowerCase().replace('zod', '') : 'string',
              description: value.description || ''
            }
          ])
        )
      }
    }))
  };
});

// Register call_tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = allTools[name as keyof typeof allTools];
  if (!tool) {
    return {
      content: [{
        type: 'text' as const,
        text: `Unknown tool: ${name}`
      }],
      isError: true
    };
  }

  try {
    // Validate args with Zod
    const validatedArgs = tool.inputSchema.parse(args);

    // Call tool handler
    const result = await tool.handler(validatedArgs as any);

    return result;
  } catch (error: any) {
    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Jira MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
