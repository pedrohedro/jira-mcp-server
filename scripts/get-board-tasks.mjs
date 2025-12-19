#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const { JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('❌ Missing JIRA_EMAIL or JIRA_API_TOKEN in .env file');
  process.exit(1);
}

// Execute curl command to get user issues (API Agile has auth issues, so we use REST API)
const curlCommand = `curl -s -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" "https://clarodigital.atlassian.net/rest/api/3/search/jql?jql=assignee=currentUser()+ORDER+BY+updated+DESC&maxResults=20" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    issues = d.get('issues', [])
    print(f'📋 Suas tarefas no Jira ({len(issues)} encontradas):')
    if not issues:
        print('  Nenhuma tarefa encontrada com assignee=currentUser()')
        print('')
        print('💡 Dica: Suas tarefas podem estar em um board específico.')
        print('   Use este comando no terminal para consultar board 1720:')
        print('')
        print('   curl -u \"\$JIRA_EMAIL:\$JIRA_API_TOKEN\" \"https://clarodigital.atlassian.net/rest/agile/1.0/board/1720/issue?maxResults=20\"')
        print('')
        print('   Ou abra: https://clarodigital.atlassian.net/secure/RapidBoard.jspa?rapidView=1720')
    else:
        for i in issues:
            key = i['key']
            summary = i['fields']['summary'][:60] + '...' if len(i['fields']['summary']) > 60 else i['fields']['summary']
            status = i['fields']['status']['name']
            updated = i['fields']['updated'][:10]  # YYYY-MM-DD
            print(f'  {key}: {summary}')
            print(f'      Status: {status} | Atualizado: {updated}')
            print('')
except json.JSONDecodeError:
    print('❌ Erro: Resposta da API não é JSON válido')
    print('   Verifique suas credenciais JIRA_EMAIL e JIRA_API_TOKEN')
"`;

console.log('🔍 Buscando suas tarefas no Jira...\n');

import { execSync } from 'child_process';
try {
  const output = execSync(curlCommand, { encoding: 'utf8' });
  console.log(output);
} catch (error) {
  console.error('❌ Erro ao executar comando:', error.message);
  process.exit(1);
}
