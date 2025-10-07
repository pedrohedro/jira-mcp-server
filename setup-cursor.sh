#!/bin/bash

# 🎨 Jira MCP Server - Setup para Cursor
# Claro Digital Team - CCoE

echo "🎨 Configurando Jira MCP Server para Cursor..."
echo "=============================================="

# Obter caminho absoluto
MCP_PATH="$(pwd)/dist/index.js"
echo "📍 Caminho do MCP server: $MCP_PATH"

# Verificar se o arquivo existe
if [ ! -f "$MCP_PATH" ]; then
    echo "❌ MCP server não encontrado. Execute ./install.sh primeiro"
    exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado. Execute ./install.sh primeiro"
    exit 1
fi

# Ler credenciais do .env
source .env

if [ -z "$JIRA_URL" ] || [ -z "$JIRA_EMAIL" ] || [ -z "$JIRA_API_TOKEN" ]; then
    echo "❌ Credenciais não configuradas no .env"
    echo "   Edite o arquivo .env com suas credenciais"
    exit 1
fi

echo "✅ Credenciais encontradas no .env"

# Criar configuração para Cursor
CURSOR_CONFIG='{
  "mcpServers": {
    "jira-claro": {
      "command": "node",
      "args": ["'$MCP_PATH'"],
      "env": {
        "JIRA_URL": "'$JIRA_URL'",
        "JIRA_EMAIL": "'$JIRA_EMAIL'",
        "JIRA_API_TOKEN": "'$JIRA_API_TOKEN'"
      }
    }
  }
}'

echo "📝 Configuração para Cursor:"
echo "============================="
echo "$CURSOR_CONFIG" | jq . 2>/dev/null || echo "$CURSOR_CONFIG"
echo ""

echo "📋 Como configurar no Cursor:"
echo "=============================="
echo ""
echo "1. Abra o Cursor"
echo "2. Pressione Cmd+Shift+P (Mac) ou Ctrl+Shift+P (Windows/Linux)"
echo "3. Digite: 'Preferences: Open User Settings (JSON)'"
echo "4. Cole a configuração acima no arquivo"
echo "5. Salve o arquivo"
echo "6. Recarregue o Cursor: Cmd+Shift+P → 'Developer: Reload Window'"
echo ""
echo "🧪 Para testar:"
echo "   Abra o chat do Cursor e digite: 'Liste meus projetos Jira'"
echo ""
echo "✨ Configuração pronta!"

