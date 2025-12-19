#!/bin/bash
# Script para criar subtarefas da CCOE-87772
set -e

cd "$(dirname "$0")/.."
source .env

PARENT="CCOE-87772"
BASE_URL="https://clarodigital.atlassian.net/rest/api/3/issue"

create_subtask() {
  local summary="$1"
  local description="$2"
  
  local payload=$(cat <<EOF
{
  "fields": {
    "project": {"key": "CCOE"},
    "parent": {"key": "$PARENT"},
    "summary": "$summary",
    "issuetype": {"name": "Subtarefa"},
    "priority": {"name": "Medium"},
    "assignee": {"id": "5fdbdf7a692b790110570812"},
    "customfield_11216": {"id": "15745"},
    "customfield_12171": {"id": "21743"},
    "description": {
      "type": "doc",
      "version": 1,
      "content": [{"type": "paragraph", "content": [{"type": "text", "text": "$description"}]}]
    }
  }
}
EOF
)

  result=$(curl -s -X POST -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$BASE_URL" \
    -d "$payload")
  
  key=$(echo "$result" | jq -r '.key // .errorMessages[0] // "ERROR"')
  echo "✅ Criada: $key - $summary"
}

echo "🚀 Criando subtarefas para $PARENT..."
echo ""

# Subtarefa 1
create_subtask \
  "Criar workflow app-detect-changes.yml no devops-templates" \
  "Criar workflow reusável para detectar mudanças em apps/ do Live repo, similar ao terraform-detect-changes.yml"

# Subtarefa 2
create_subtask \
  "Adicionar template taskdefinition.json no live-template" \
  "Criar estrutura de pastas apps/ no live-template com taskdefinition.json template para ECS"

# Subtarefa 3
create_subtask \
  "Criar workflow app-deploy.yml no live-template" \
  "Implementar workflow que faz deploy ECS usando taskdefinition.json quando detecta mudanças"

# Subtarefa 4
create_subtask \
  "Documentar fluxo GitOps para deploy de apps" \
  "Criar documentação explicando o fluxo de deploy via Live repository com taskdefinition.json"

# Subtarefa 5
create_subtask \
  "Implementar GitOps no bkf-ecare-live" \
  "Adicionar taskdefinition.json e configurar workflows no projeto BKF como prova de conceito"

echo ""
echo "✅ Todas as subtarefas criadas!"
echo "📋 Ver em: https://clarodigital.atlassian.net/browse/$PARENT"
