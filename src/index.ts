#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { CallToolRequestSchema, ListToolsRequestSchema, isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { JiraClient } from './jira-client.js';
import { createQueryTools } from './tools/queries.js';
import { createWorklogTools } from './tools/worklog.js';
import { createCommentTools } from './tools/comments.js';
import { createIssueManagementTools } from './tools/issue-management.js';
import { createAttachmentTools } from './tools/attachments.js';
import { ConfluenceClient } from './confluence-client.js';
import { createConfluenceManagementTools } from './tools/confluence-management.js';
import { logger, metrics } from './utils/logger.js';

// Load environment variables from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

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

// Initialize Confluence client (shares the same Atlassian Cloud credentials and base URL)
const confluenceClient = new ConfluenceClient({
  baseUrl: process.env.JIRA_URL!,
  email: process.env.JIRA_EMAIL!,
  apiToken: process.env.JIRA_API_TOKEN!
});

logger.info('Jira MCP Server initializing...', {
  jiraUrl: process.env.JIRA_URL,
  email: process.env.JIRA_EMAIL
});

// Create all tools
const queryTools = createQueryTools(jiraClient);
const worklogTools = createWorklogTools(jiraClient);
const commentTools = createCommentTools(jiraClient);
const issueManagementTools = createIssueManagementTools(jiraClient);
const attachmentTools = createAttachmentTools(jiraClient);
const confluenceTools = createConfluenceManagementTools(confluenceClient);

// Combine all tools
const allTools = {
  ...queryTools,
  ...worklogTools,
  ...commentTools,
  ...issueManagementTools,
  ...attachmentTools,
  ...confluenceTools
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
    case 'ZodRecord':
      // Record<string, any> should be an object with additionalProperties
      const valueType = zodType._def.valueType;
      return {
        type: 'object',
        additionalProperties: valueType ? getJsonSchemaType(valueType) : true
      };
    case 'ZodAny':
      // Any type - allow any value
      return {};
    case 'ZodArray':
      const itemType = zodType._def.type;
      return {
        type: 'array',
        items: itemType ? getJsonSchemaType(itemType) : { type: 'string' }
      };
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

// Create MCP server (used for stdio mode)
const server = createServer();

// Determine transport mode from env or CLI args
const transportMode = process.argv.includes('--http')
  ? 'http'
  : (process.env.MCP_TRANSPORT || 'stdio');

// Start server in stdio mode (backward compatible)
async function startStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Jira MCP Server running on stdio');
}

// Start server in streamable-http mode (remote)
async function startHttp() {
  const port = parseInt(process.env.MCP_PORT || '3000', 10);
  const host = process.env.MCP_HOST || '127.0.0.1';

  const app = createMcpExpressApp({ host });

  // Session management
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  // Health check endpoint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', service: 'jira-mcp-server', transport: 'streamable-http' });
  });

  // MCP POST endpoint - handles initialization and tool calls
  app.post('/mcp', async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            logger.info(`MCP session initialized: ${sid}`);
            transports[sid] = transport;
          }
        });

        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            logger.info(`Transport closed for session ${sid}`);
            delete transports[sid];
          }
        };

        // Each session gets its own server instance
        const sessionServer = createServer();
        await sessionServer.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
          id: null
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error('Error handling MCP request:', { error });
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null
        });
      }
    }
  });

  // MCP GET endpoint - SSE streams
  app.get('/mcp', async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  });

  // MCP DELETE endpoint - session termination
  app.delete('/mcp', async (req: any, res: any) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    try {
      await transports[sessionId].handleRequest(req, res);
    } catch (error) {
      logger.error('Error handling session termination:', { error });
      if (!res.headersSent) {
        res.status(500).send('Error processing session termination');
      }
    }
  });

  app.listen(port, () => {
    logger.info(`Jira MCP Server (streamable-http) listening on ${host}:${port}`);
    console.error(`Jira MCP Server running on http://${host}:${port}/mcp`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down server...');
    for (const sid in transports) {
      try {
        await transports[sid].close();
        delete transports[sid];
      } catch (error) {
        logger.error(`Error closing transport for session ${sid}:`, { error });
      }
    }
    process.exit(0);
  });
}

// Factory function to create a configured MCP server instance (for http mode, one per session)
function createServer(): Server {
  const s = new Server(
    { name: 'jira-mcp-server', version: '2.3.0' },
    { capabilities: { tools: {} } }
  );

  s.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.entries(allTools).map(([name, tool]) => {
        const properties: Record<string, any> = {};
        const required: string[] = [];
        for (const [key, value] of Object.entries(tool.inputSchema.shape)) {
          const fieldSchema = getJsonSchemaType(value);
          if (value.description) fieldSchema.description = value.description;
          properties[key] = fieldSchema;
          const typeName = (value as any)._def?.typeName;
          if (typeName !== 'ZodOptional' && typeName !== 'ZodDefault') required.push(key);
        }
        return {
          name,
          description: tool.description,
          inputSchema: { type: 'object', properties, required: required.length > 0 ? required : undefined }
        };
      })
    };
  });

  s.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Tool called: ${name}`, { tool: name, args });
    metrics.trackToolUsage(name);

    const tool = allTools[name as keyof typeof allTools];
    if (!tool) {
      logger.error(`Unknown tool: ${name}`, { tool: name });
      metrics.trackError('unknown_tool');
      return { content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }], isError: true };
    }

    try {
      const validatedArgs = tool.inputSchema.parse(args);
      const result = await tool.handler(validatedArgs as any);
      logger.info(`Tool executed successfully: ${name}`, { tool: name });
      return result;
    } catch (error: any) {
      logger.error(`Tool execution failed: ${name}`, { tool: name, error: error.message, stack: error.stack });
      metrics.trackError(error.name || 'execution_error');
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
    }
  });

  return s;
}

// Main entrypoint
async function main() {
  if (transportMode === 'http') {
    await startHttp();
  } else {
    await startStdio();
  }
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
