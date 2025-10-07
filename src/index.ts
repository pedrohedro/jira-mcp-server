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

// Helper function to convert Zod type to JSON Schema type
function getJsonSchemaType(zodType: any): any {
  const typeName = zodType._def?.typeName;
  
  if (!typeName) {
    return { type: 'string' };
  }
  
  switch (typeName) {
    case 'ZodString':
      return { type: 'string' };
    case 'ZodNumber':
      return { type: 'number' };
    case 'ZodBoolean':
      return { type: 'boolean' };
    case 'ZodObject':
      return { type: 'object' };
    case 'ZodArray':
      return { type: 'array' };
    case 'ZodEnum':
      // For enums, we need to extract the values
      const values = zodType._def.values;
      return { 
        type: 'string',
        enum: values ? Object.values(values) : undefined
      };
    case 'ZodOptional':
      // For optional types, we need to unwrap and get the inner type
      return getJsonSchemaType(zodType._def.innerType);
    case 'ZodDefault':
      // For default types, we need to unwrap and get the inner type
      const innerSchema = getJsonSchemaType(zodType._def.innerType);
      return {
        ...innerSchema,
        default: zodType._def.defaultValue()
      };
    default:
      return { type: 'string' };
  }
}

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
    tools: Object.entries(allTools).map(([name, tool]) => {
      // Build the properties object for the input schema
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      // Process each field in the Zod schema
      for (const [key, value] of Object.entries(tool.inputSchema.shape)) {
        const fieldSchema = getJsonSchemaType(value);
        
        // Add description if available
        if (value.description) {
          fieldSchema.description = value.description;
        }
        
        properties[key] = fieldSchema;
        
        // Check if field is required (not optional)
        const typeName = (value as any)._def?.typeName;
        if (typeName !== 'ZodOptional' && typeName !== 'ZodDefault') {
          required.push(key);
        }
      }
      
      return {
        name,
        description: tool.description,
        inputSchema: {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined
        }
      };
    })
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
