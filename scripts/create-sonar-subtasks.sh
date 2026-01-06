#!/bin/bash
# Script para criar subtarefas da história CCOE-88569
# Integração do sonar-scanner.properties no Pipeline GitHub Actions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../.env"

PARENT_KEY="CCOE-88569"
API_URL="${JIRA_URL}/rest/api/3/issue"

create_subtask() {
  local summary="$1"
  local result=$(curl -s -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
    -X POST \
    -H "Content-Type: application/json" \
    "${API_URL}" \
    -d "{\"fields\":{\"project\":{\"key\":\"CCOE\"},\"summary\":\"${summary}\",\"issuetype\":{\"id\":\"10007\"},\"parent\":{\"key\":\"${PARENT_KEY}\"}}}")
  
  local key=$(echo "$result" | jq -r '.key // empty')
  local error=$(echo "$result" | jq -r '.errorMessages // empty')
  
  if [ -n "$key" ]; then
    echo "✅ Created: $key - $summary"
  else
    echo "❌ Failed: $summary"
    echo "   Error: $error"
  fi
}

echo "🚀 Creating subtasks for ${PARENT_KEY}..."
echo ""

# Subtarefas
create_subtask "[devops-templates] Adicionar inputs project-base-dir e sonar-args na action sonarqube-scan"
create_subtask "[devops-templates] Integrar project-base-dir no job sonarqube do orchestrator-universal.yml"
create_subtask "[bkf-billing-services] Renomear sonar-scanner.properties para sonar-project.properties"
create_subtask "[bkf-billing-services] Ajustar sonar.sources de /usr/src para . no sonar-project.properties"
create_subtask "[devops-templates] Atualizar documentacao da action sonarqube-scan com novos inputs"
create_subtask "[devops-templates] Testar integracao SonarQube com pipeline do bkf-billing-services"

echo ""
echo "✨ Done! View parent issue: ${JIRA_URL}/browse/${PARENT_KEY}"
