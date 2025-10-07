#!/bin/bash

# 🚀 Jira MCP Server - Script de Instalação
# Claro Digital Team - CCoE

echo "🚀 Instalando Jira MCP Server..."
echo "=================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão $NODE_VERSION encontrada. Necessário versão 18+"
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

# Verificar compilação
if [ ! -f "dist/index.js" ]; then
    echo "❌ Erro na compilação. Verifique os logs acima."
    exit 1
fi

echo "✅ Compilação bem-sucedida"

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << 'EOF'
JIRA_URL=https://clarodigital.atlassian.net
JIRA_EMAIL=seu-email@claro.com.br
JIRA_API_TOKEN=seu-token-aqui
EOF
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais!"
    echo "   - JIRA_EMAIL: Seu email da Claro"
    echo "   - JIRA_API_TOKEN: Seu token da Atlassian"
    echo "   - Gerar token: https://id.atlassian.com/manage/api-tokens"
else
    echo "✅ Arquivo .env já existe"
fi

# Testar MCP server
echo "🧪 Testando MCP server..."
if echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js > /dev/null 2>&1; then
    echo "✅ MCP server funcionando!"
else
    echo "⚠️  MCP server não respondeu. Verifique as credenciais no .env"
fi

echo ""
echo "🎉 Instalação concluída!"
echo "========================="
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env com suas credenciais"
echo "2. Configure no seu editor:"
echo "   - Cursor: .cursor/mcp.json"
echo "   - VS Code: settings.json"
echo "   - Claude Code: claude_desktop_config.json"
echo ""
echo "📚 Documentação:"
echo "   - README.md - Visão geral"
echo "   - CURSOR_SETUP.md - Setup para Cursor"
echo "   - VSCODE_COPILOT_SETUP.md - Setup para VS Code"
echo "   - TOOLS.md - Documentação dos tools"
echo ""
echo "🔧 Caminho do MCP server:"
echo "   $(pwd)/dist/index.js"
echo ""
echo "✨ Pronto para usar!"

