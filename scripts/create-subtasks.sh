#!/bin/bash
cd "$(dirname "$0")/.."
source .env

PARENT="CCOE-87772"
URL="https://clarodigital.atlassian.net/rest/api/3/issue"

echo "🚀 Criando subtarefas para $PARENT..."

# Subtarefa 1
echo -n "1/5 app-detect-changes.yml... "
curl -s -X POST -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -H "Content-Type: application/json" "$URL" \
  -d '{"fields":{"project":{"key":"CCOE"},"parent":{"key":"CCOE-87772"},"summary":"[1/5] Criar app-detect-changes.yml no devops-templates","issuetype":{"id":"10007"},"priority":{"name":"Medium"},"assignee":{"id":"5fdbdf7a692b790110570812"},"description":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Criar workflow reusavel similar ao terraform-detect-changes.yml para detectar mudancas em apps/ do Live repository."}]}]}}}' | jq -r '.key // .errors'

# Subtarefa 2
echo -n "2/5 taskdefinition.json template... "
curl -s -X POST -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -H "Content-Type: application/json" "$URL" \
  -d '{"fields":{"project":{"key":"CCOE"},"parent":{"key":"CCOE-87772"},"summary":"[2/5] Adicionar template taskdefinition.json no live-template","issuetype":{"id":"10007"},"priority":{"name":"Medium"},"assignee":{"id":"5fdbdf7a692b790110570812"},"description":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Criar estrutura apps/ no live-template cookiecutter com taskdefinition.json para cada ambiente (develop/production)."}]}]}}}' | jq -r '.key // .errors'

# Subtarefa 3
echo -n "3/5 app-deploy.yml workflow... "
curl -s -X POST -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -H "Content-Type: application/json" "$URL" \
  -d '{"fields":{"project":{"key":"CCOE"},"parent":{"key":"CCOE-87772"},"summary":"[3/5] Criar workflow app-deploy.yml no live-template","issuetype":{"id":"10007"},"priority":{"name":"Medium"},"assignee":{"id":"5fdbdf7a692b790110570812"},"description":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Implementar workflow que recebe output do app-detect-changes e executa deploy ECS para cada app modificado usando taskdefinition.json."}]}]}}}' | jq -r '.key // .errors'

# Subtarefa 4
echo -n "4/5 Documentacao GitOps... "
curl -s -X POST -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -H "Content-Type: application/json" "$URL" \
  -d '{"fields":{"project":{"key":"CCOE"},"parent":{"key":"CCOE-87772"},"summary":"[4/5] Documentar fluxo GitOps para deploy de apps ECS","issuetype":{"id":"10007"},"priority":{"name":"Medium"},"assignee":{"id":"5fdbdf7a692b790110570812"},"description":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Criar documentacao explicando o fluxo de deploy via Live repository com taskdefinition.json, incluindo exemplos e troubleshooting."}]}]}}}' | jq -r '.key // .errors'

# Subtarefa 5
echo -n "5/5 Implementar no BKF... "
curl -s -X POST -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -H "Content-Type: application/json" "$URL" \
  -d '{"fields":{"project":{"key":"CCOE"},"parent":{"key":"CCOE-87772"},"summary":"[5/5] Implementar GitOps no projeto BKF (Ecare-Claro)","issuetype":{"id":"10007"},"priority":{"name":"Medium"},"assignee":{"id":"5fdbdf7a692b790110570812"},"description":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Adicionar taskdefinition.json e configurar workflows no bkf-ecare-live como prova de conceito da arquitetura GitOps para apps."}]}]}}}' | jq -r '.key // .errors'

echo ""
echo "✅ Subtarefas criadas!"
echo "📋 Ver: https://clarodigital.atlassian.net/browse/$PARENT"
