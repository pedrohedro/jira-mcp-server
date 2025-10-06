# 🎨 Jira MCP Server - Guia de Setup para Cursor

Este guia detalha como configurar e usar o Jira MCP Server no **Cursor**, o editor de código com IA integrado.

## 📋 Pré-requisitos

- **Cursor**: versão 0.40+ com suporte MCP
- **Node.js**: versão 18 ou superior
- **Jira Cloud**: acesso à instância da Claro Digital
- **API Token**: da Atlassian (geraremos abaixo)

### Verificar Cursor e Node.js

```bash
# Verificar Node.js
node --version
# Deve mostrar v18.x.x ou superior

# Verificar Cursor
cursor --version
# Ou abra Cursor → About
```

Se não tiver Cursor, instale de: https://cursor.sh/

## 🚀 Instalação Passo a Passo

### 1. Preparar o MCP Server

**Se você ainda não tem o código:**

```bash
cd ~/Documents/Trabalho/Claro
git clone https://github.com/TechTeam-ClaroEmpresas/jira-mcp-server
# Ou descompacte o ZIP recebido
cd jira-mcp-server
```

### 2. Instalar Dependências

```bash
npm install
```

Isso instalará:
- `@modelcontextprotocol/sdk` - SDK MCP oficial
- `axios` - Cliente HTTP para Jira API
- `zod` - Validação de schemas
- `dotenv` - Gerenciamento de variáveis de ambiente

### 3. Gerar API Token do Jira

1. Acesse: https://id.atlassian.com/manage/api-tokens
2. Clique em **"Create API token"**
3. Nome sugerido: `Cursor MCP Server`
4. **Copie o token** (você só verá uma vez!)

### 4. Compilar TypeScript

```bash
npm run build
```

Isso cria a pasta `dist/` com o código JavaScript compilado.

Verifique:
```bash
ls -la dist/
# Deve ver: index.js, jira-client.js, tools/...
```

### 5. Obter Caminho Absoluto

```bash
cd jira-mcp-server
pwd
```

Copie o resultado (exemplo: `/Users/pedrohedro/Documents/Trabalho/Claro/jira-mcp-server`)

## ⚙️ Configuração no Cursor

O Cursor suporta **dois métodos** de configuração MCP:

### Método 1: Configuração Global (Recomendado para Uso Pessoal)

Edite o arquivo de configuração global do Cursor:

**No Mac:**
```bash
code ~/Library/Application\ Support/Cursor/User/globalStorage/mcp.json
# Ou use o próprio Cursor:
cursor ~/Library/Application\ Support/Cursor/User/globalStorage/mcp.json
```

**No Linux:**
```bash
code ~/.config/Cursor/User/globalStorage/mcp.json
```

Adicione a configuração:

```json
{
  "mcpServers": {
    "jira-claro": {
      "command": "node",
      "args": ["/Users/pedrohedro/Documents/Trabalho/Claro/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "https://clarodigital.atlassian.net",
        "JIRA_EMAIL": "pedro.hedro.glo@gcp.clarobrasil.mobi",
        "JIRA_API_TOKEN": "ATATT3xFfGF0Ue7auMqvIc16WRvg1xP7LkTZMAicue7DkvFF07iMW4-ZJBkw5pWcxbjconYb93DPvPORPNchSL1aGxbfrcd9YOutXxwWid6NKi0yR4g5Zzqr6jFqruKK2_uDTBRByD74cGGP7E045ki-TNLz-6BEFFy0U00b2JcUF1S6PAqt8Yw=3B9C8EEC"
      }
    }
  }
}
```

**✅ Vantagens:**
- Disponível em todos os projetos
- Configuração única
- Fácil de gerenciar

**❌ Desvantagens:**
- Credenciais em arquivo global
- Menos flexibilidade por projeto

### Método 2: Configuração por Projeto (Recomendado para Equipes)

Crie um arquivo de configuração MCP específico do projeto:

```bash
cd seu-projeto
mkdir -p .cursor
nano .cursor/mcp.json
```

Adicione a configuração:

```json
{
  "mcpServers": {
    "jira-claro": {
      "command": "node",
      "args": ["/Users/pedrohedro/Documents/Trabalho/Claro/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "https://clarodigital.atlassian.net",
        "JIRA_EMAIL": "pedro.hedro.glo@gcp.clarobrasil.mobi",
        "JIRA_API_TOKEN": "ATATT3xFfGF0Ue7auMqvIc16WRvg1xP7LkTZMAicue7DkvFF07iMW4-ZJBkw5pWcxbjconYb93DPvPORPNchSL1aGxbfrcd9YOutXxwWid6NKi0yR4g5Zzqr6jFqruKK2_uDTBRByD74cGGP7E045ki-TNLz-6BEFFy0U00b2JcUF1S6PAqt8Yw=3B9C8EEC"
      }
    }
  }
}
```

**Adicione ao .gitignore:**
```bash
echo ".cursor/mcp.json" >> .gitignore
```

**✅ Vantagens:**
- Configuração específica por projeto
- Melhor para equipes (cada um tem seu token)
- Versionável (sem credenciais no Git)

**❌ Desvantagens:**
- Precisa configurar em cada projeto
- Manutenção em múltiplos lugares

### Método 3: Configuração Híbrida (Melhor dos Dois Mundos)

Use variáveis de ambiente + arquivo de referência:

**1. Crie arquivo `.env` no projeto:**
```bash
cd seu-projeto
nano .env
```

Conteúdo:
```env
JIRA_URL=https://clarodigital.atlassian.net
JIRA_EMAIL=seu-email@claro.com.br
JIRA_API_TOKEN=seu-token-aqui
```

**2. Configure `.cursor/mcp.json` para ler do `.env`:**
```json
{
  "mcpServers": {
    "jira-claro": {
      "command": "node",
      "args": ["/caminho/absoluto/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "${JIRA_URL}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"
      }
    }
  }
}
```

**3. Adicione ao .gitignore:**
```bash
echo ".env" >> .gitignore
echo ".cursor/mcp.json" >> .gitignore
```

**4. Compartilhe template:**
```bash
# .cursor/mcp.json.example
{
  "mcpServers": {
    "jira-claro": {
      "command": "node",
      "args": ["/CAMINHO/ABSOLUTO/PARA/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "${JIRA_URL}",
        "JIRA_EMAIL": "${JIRA_EMAIL}",
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}"
      }
    }
  }
}
```

## 🔄 Recarregar Cursor

Após configurar, recarregue o Cursor:

**Opção 1: Command Palette**
```
Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows/Linux)
Digite: "Reload Window"
Enter
```

**Opção 2: Reiniciar Completamente**
```
Feche o Cursor
Abra novamente
```

## ✅ Verificar que Funcionou

### 1. Verificar MCP Server Ativo

No Cursor, abra o painel de chat AI e digite:

```
Liste meus projetos Jira
```

Ou use o atalho: `Cmd+L` (Mac) / `Ctrl+L` (Windows/Linux)

**Resposta esperada:**
```
📋 Found X projects:

**EM** - Embaixadores (software)
**CCOE** - CCoE - Cloud Center of Excellence (software)
**DA** - JEDI - DATAHUB (software)
...
```

### 2. Verificar Tools Disponíveis

Na interface do chat, você pode ver os MCP tools ativos clicando no ícone de ferramentas (🔧) ou usando:

```
Quais ferramentas Jira você tem disponível?
```

**Resposta esperada:**
```
Tenho 10 ferramentas Jira:

📋 Queries:
- list_my_tasks
- list_subtasks
- list_sprint_active
- list_in_development
- list_projects
- custom_query

⏱️ Worklogs:
- add_worklog
- list_worklogs

💬 Comments:
- add_comment
- list_comments
```

### 3. Testar Funcionalidades

```
Mostre minhas tarefas da sprint ativa
```

```
Adicione 1 hora de worklog em CCOE-82835 com comentário "Configuração do MCP server"
```

```
Adicione um comentário em CCOE-82835: "Testando integração Cursor + Jira MCP"
```

## 💬 Exemplos de Uso no Cursor

### Consultar Tarefas

```
👤 Você: "Quais são minhas subtarefas da sprint atual?"

🤖 Cursor AI: [usa list_subtasks]
📋 Found 5 subtasks in current sprint:

**CCOE-82835**: Implementar políticas de branch protection
Status: To Development | Priority: Medium
Updated: 2025-10-06

**CCOE-82834**: Configurar templates de PR
Status: To Development | Priority: Medium
Updated: 2025-10-06
...
```

### Registrar Tempo

```
👤 Você: "Registre 2 horas e 30 minutos em CCOE-82835"

🤖 Cursor AI: [usa add_worklog]
✅ Worklog added to CCOE-82835
⏱️  Time: 2h 30m
```

### Workflow Integrado com Código

```
👤 Você: "Estou trabalhando em CCOE-82835. Mostre a issue, depois registre 1h de trabalho e adicione um comentário dizendo 'Implementado sistema de branch protection'"

🤖 Cursor AI:
[usa list_my_tasks para buscar CCOE-82835]
📋 **CCOE-82835**: Implementar políticas de branch protection
Status: To Development
...

[usa add_worklog]
✅ Worklog: 1h adicionado

[usa add_comment]
✅ Comment added: "Implementado sistema de branch protection"
```

### Query JQL Customizada

```
👤 Você: "Execute a query JQL: project = CCOE AND status = 'In Development' AND assignee = currentUser()"

🤖 Cursor AI: [usa custom_query]
📋 Found 3 issues:
...
```

## 🎯 Features Exclusivas do Cursor

### 1. Agent Mode

O Cursor pode executar múltiplas ações em sequência:

```
👤 Você: "Analise meu código, identifique a issue relacionada, registre tempo trabalhado e atualize a issue com um resumo do que foi feito"

🤖 Cursor AI:
1. [analisa código]
2. [identifica CCOE-82835 nos commits]
3. [usa add_worklog]
4. [usa add_comment com resumo]
```

### 2. Context-Aware Suggestions

Cursor entende contexto do código:

```python
# arquivo.py
# TODO: CCOE-82835 - Implementar validação

def validate_branch():
    pass
```

```
👤 Você: "Mostre detalhes dessa issue"

🤖 Cursor AI: [detecta CCOE-82835 no código]
[usa list_my_tasks com filtro]
📋 **CCOE-82835**: Implementar políticas de branch protection
...
```

### 3. One-Click Actions

Configure atalhos para ações comuns:

**Cursor Settings → Keyboard Shortcuts:**
- `Cmd+K` + `J` → "Liste minhas tarefas da sprint"
- `Cmd+K` + `W` → "Registre tempo na última issue mencionada"

## 🐛 Troubleshooting

### Problema: MCP Server não aparece

**Sintomas:**
- Cursor não reconhece comandos Jira
- Tools não aparecem no painel

**Soluções:**
1. **Verificar configuração:**
   ```bash
   cat .cursor/mcp.json
   # Ou
   cat ~/Library/Application\ Support/Cursor/User/globalStorage/mcp.json
   ```

2. **Validar JSON:**
   ```bash
   node -e "console.log(JSON.parse(require('fs').readFileSync('.cursor/mcp.json')))"
   ```

3. **Verificar caminho absoluto:**
   ```bash
   ls -la /caminho/do/args/dist/index.js
   # Deve existir!
   ```

4. **Reload Window:**
   ```
   Cmd+Shift+P → "Reload Window"
   ```

### Problema: Erro de Autenticação

**Sintomas:**
- "401 Unauthorized"
- "Invalid credentials"

**Soluções:**
1. **Verificar credenciais no env:**
   ```bash
   # Se usando config direta
   cat .cursor/mcp.json | grep JIRA_EMAIL

   # Se usando .env
   cat .env
   ```

2. **Gerar novo token:**
   - https://id.atlassian.com/manage/api-tokens
   - Criar novo token
   - Atualizar em `mcp.json` ou `.env`

3. **Testar credenciais manualmente:**
   ```bash
   curl -u "email@claro.com.br:SEU_TOKEN" \
     https://clarodigital.atlassian.net/rest/api/3/myself
   ```

### Problema: "command not found: node"

**Sintomas:**
- Cursor não consegue executar o MCP server
- Erro "node: command not found"

**Soluções:**
1. **Verificar Node.js instalado:**
   ```bash
   which node
   # Deve mostrar: /usr/local/bin/node ou similar
   ```

2. **Usar caminho absoluto do node:**
   ```json
   {
     "mcpServers": {
       "jira-claro": {
         "command": "/usr/local/bin/node",
         "args": ["/caminho/dist/index.js"]
       }
     }
   }
   ```

3. **Adicionar ao PATH (Mac):**
   ```bash
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

### Problema: MCP Server crasheando

**Sintomas:**
- Tools param de funcionar após alguns minutos
- Errors intermitentes

**Soluções:**
1. **Ver logs do Cursor:**
   ```bash
   # Mac
   tail -f ~/Library/Logs/Cursor/main.log

   # Linux
   tail -f ~/.config/Cursor/logs/main.log
   ```

2. **Testar MCP server standalone:**
   ```bash
   cd jira-mcp-server
   node dist/index.js
   # Deve mostrar: "Jira MCP Server running on stdio"
   # Ctrl+C para sair
   ```

3. **Aumentar timeout:**
   ```json
   {
     "mcpServers": {
       "jira-claro": {
         "command": "node",
         "args": ["/caminho/dist/index.js"],
         "timeout": 60000
       }
     }
   }
   ```

### Problema: Slow Performance

**Sintomas:**
- Respostas lentas do MCP
- Cursor travando ao usar Jira tools

**Soluções:**
1. **Limitar max results:**
   ```
   Liste apenas 10 tarefas da sprint ativa
   ```

2. **Usar queries específicas:**
   ```
   Execute JQL: project = CCOE AND sprint in openSprints() ORDER BY updated DESC
   ```

3. **Cache local (futuro):**
   - Feature planejada no MCP server

## 🔒 Segurança

### Proteger Credenciais

**Se usando config por projeto:**

```bash
# 1. Garantir que .env e mcp.json não são commitados
echo ".env" >> .gitignore
echo ".cursor/mcp.json" >> .gitignore

# 2. Criar templates versionáveis
cp .env .env.example
cp .cursor/mcp.json .cursor/mcp.json.example

# 3. Remover valores sensíveis dos examples
sed -i '' 's/ATATT.*/SEU_TOKEN_AQUI/g' .env.example
```

**Verificar permissões:**
```bash
ls -la .env .cursor/mcp.json
# Deve mostrar: -rw------- (600)

# Se não:
chmod 600 .env .cursor/mcp.json
```

### Revogar Token Comprometido

Se seu token vazar:

1. **Revogar imediatamente:**
   - https://id.atlassian.com/manage/api-tokens
   - Encontre o token → **Revoke**

2. **Gerar novo:**
   - Create API token → Copiar

3. **Atualizar configurações:**
   ```bash
   nano .env
   # Ou
   nano .cursor/mcp.json
   ```

4. **Reload Cursor:**
   ```
   Cmd+Shift+P → "Reload Window"
   ```

## 🤝 Compartilhar com Equipe

### Setup para Colegas

**1. Compartilhe o repositório:**
```bash
cd jira-mcp-server
git remote -v
# Enviar URL do repo para colegas
```

**2. Documentação para colegas:**

```markdown
# Quick Start para Equipe

1. Clone o repo:
   git clone https://github.com/TechTeam-ClaroEmpresas/jira-mcp-server
   cd jira-mcp-server

2. Instale dependências:
   npm install

3. Compile:
   npm run build

4. Configure Cursor:
   - Copie .cursor/mcp.json.example para seu projeto
   - Adicione suas credenciais Jira
   - Reload Cursor

5. Teste:
   "Liste meus projetos Jira"
```

### Template de Configuração para Equipe

**`.cursor/mcp.json.example`:**
```json
{
  "mcpServers": {
    "jira-claro": {
      "command": "node",
      "args": ["/ALTERE/PARA/SEU/CAMINHO/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "https://clarodigital.atlassian.net",
        "JIRA_EMAIL": "SEU_EMAIL@claro.com.br",
        "JIRA_API_TOKEN": "SEU_TOKEN_AQUI"
      }
    }
  }
}
```

**Cada dev deve:**
1. Copiar example → `mcp.json`
2. Gerar próprio API token
3. Preencher suas credenciais
4. **Nunca** commitar `mcp.json` com credenciais!

## 📊 Diferenças vs Claude Code

| Feature | Cursor | Claude Code |
|---------|--------|-------------|
| **Config Location** | `.cursor/mcp.json` ou global | `~/Library/.../claude_desktop_config.json` |
| **Project-level Config** | ✅ Sim | ❌ Não |
| **Hot Reload** | ✅ Sim (`Reload Window`) | ❌ Requer restart completo |
| **Context Awareness** | ✅✅ Excelente (código + MCP) | ✅ Bom |
| **Agent Mode** | ✅ Multi-step actions | ✅ Similar |
| **Performance** | ✅ Otimizado | ✅ Bom |
| **UI Integration** | ✅ Chat inline + sidebar | ✅ Chat sidebar |

## 📚 Recursos Adicionais

- **Cursor Documentation**: https://docs.cursor.com/context/model-context-protocol
- **MCP Protocol Spec**: https://modelcontextprotocol.io
- **Jira REST API**: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- **Tools Documentation**: [TOOLS.md](./TOOLS.md)

## 🎓 Dicas Avançadas

### 1. Configuração Multi-Projeto

```bash
# Projeto A (infra)
~/projects/infra/.cursor/mcp.json → Jira CCOE

# Projeto B (frontend)
~/projects/frontend/.cursor/mcp.json → Jira FLX

# Projeto C (backend)
~/projects/backend/.cursor/mcp.json → Jira API
```

### 2. Aliases para Cursor Chat

Configure snippets comuns:

```
// Cursor Settings → Snippets
{
  "jira-sprint": "Liste minhas subtarefas da sprint atual",
  "jira-log": "Registre ${1:2h} em ${2:ISSUE-KEY} com comentário '${3:descrição}'",
  "jira-done": "Mova ${1:ISSUE-KEY} para Done e registre ${2:1h}"
}
```

### 3. Workflow Automático

```
👤 Você: "@jira Ao finalizar código, registre tempo e atualize issue"

🤖 Cursor: [configura watcher]
[detecta commit → extrai issue → add_worklog + add_comment]
```

## 🔄 Atualizar MCP Server

```bash
cd jira-mcp-server
git pull  # Se usando Git
npm install
npm run build

# Reload Cursor
# Cmd+Shift+P → "Reload Window"
```

---

**✅ Setup Completo!** Você está pronto para usar Jira diretamente no Cursor com conversação natural!

**Próximos passos:**
- Explore os [10 tools disponíveis](./TOOLS.md)
- Configure [workflows automáticos](#3-workflow-automático)
- Compartilhe com sua [equipe](#-compartilhar-com-equipe)

**Made with ❤️ by Claro Digital Team - CCoE**
