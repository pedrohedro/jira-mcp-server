import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { JiraClient } from '../dist/jira-client.js';
import { createQueryTools } from '../dist/tools/queries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// load env from project root
dotenv.config({ path: join(__dirname, '..', '.env') });

const requiredEnvVars = ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];
for (const v of requiredEnvVars) {
  if (!process.env[v]) {
    console.error(`Missing ${v} in environment or .env`);
    process.exit(1);
  }
}

const jiraClient = new JiraClient({
  baseUrl: process.env.JIRA_URL,
  email: process.env.JIRA_EMAIL,
  apiToken: process.env.JIRA_API_TOKEN
});

const queryTools = createQueryTools(jiraClient);

(async () => {
  try {
    const tool = queryTools.list_my_tasks;
    const result = await tool.handler({});
    console.log('--- RESULT START ---');
    for (const block of result.content) {
      if (block.type === 'text') console.log(block.text);
    }
    console.log('--- RESULT END ---');
  } catch (err) {
    console.error('Error running tool:', err);
    process.exit(1);
  }
})();
