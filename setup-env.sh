#!/bin/bash

# Script para configurar variáveis de ambiente do Jira MCP Server
# Este script adiciona as variáveis ao ~/.zshrc ou ~/.bashrc

set -e

echo "🔐 Configuração Segura do Jira MCP Server"
echo "=========================================="
echo ""

# Detectar shell
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    echo "❌ Erro: Não foi possível detectar ~/.zshrc ou ~/.bashrc"
    exit 1
fi

echo "Shell detectado: $SHELL_CONFIG"
echo ""

# Solicitar informações
read -p "Jira URL (ex: https://clarodigital.atlassian.net): " JIRA_URL
read -p "Jira Email: " JIRA_EMAIL
read -sp "Jira API Token: " JIRA_API_TOKEN
echo ""
echo ""

# Remover variáveis antigas se existirem
echo "Removendo configurações antigas..."
sed -i.bak '/# Jira MCP Server/d' "$SHELL_CONFIG"
sed -i.bak '/export JIRA_URL=/d' "$SHELL_CONFIG"
sed -i.bak '/export JIRA_EMAIL=/d' "$SHELL_CONFIG"
sed -i.bak '/export JIRA_API_TOKEN=/d' "$SHELL_CONFIG"

# Adicionar novas variáveis
echo "" >> "$SHELL_CONFIG"
echo "# Jira MCP Server Configuration" >> "$SHELL_CONFIG"
echo "export JIRA_URL=\"$JIRA_URL\"" >> "$SHELL_CONFIG"
echo "export JIRA_EMAIL=\"$JIRA_EMAIL\"" >> "$SHELL_CONFIG"
echo "export JIRA_API_TOKEN=\"$JIRA_API_TOKEN\"" >> "$SHELL_CONFIG"

echo "✅ Variáveis de ambiente configuradas em $SHELL_CONFIG"
echo ""
echo "⚠️  IMPORTANTE: Execute o comando abaixo para aplicar as mudanças:"
echo "    source $SHELL_CONFIG"
echo ""
echo "Ou feche e abra novamente o terminal."
echo ""
echo "🔒 As credenciais foram salvas de forma segura e não aparecerão mais no VS Code settings.json"
