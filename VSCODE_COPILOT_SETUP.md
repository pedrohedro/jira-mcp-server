# 🚀 Jira MCP Server - Guia de Setup para VS Code + GitHub Copilot

Este guia detalha como configurar e usar o Jira MCP Server no **VS Code com GitHub Copilot**, aproveitando o suporte MCP disponível desde a versão 1.102.

## 📋 Pré-requisitos

- **VS Code**: versão 1.102 ou superior (com suporte MCP GA)
- **GitHub Copilot**: assinatura ativa (Individual, Business, ou Enterprise)
- **Node.js**: versão 18 ou superior
- **Jira Cloud**: acesso à instância da Claro Digital
- **API Token**: da Atlassian (geraremos abaixo)

### Verificar Versões

```bash
# Verificar VS Code
code --version
# Primeira linha deve ser >= 1.102

# Verificar Node.js
node --version
# Deve mostrar v18.x.x ou superior
```

**Atualizar VS Code:**
- `Code → Check for Updates...` (Mac)
- `Help → Check for Updates...` (Windows/Linux)

**Verificar GitHub Copilot:**
- Abra VS Code
- `Cmd+Shift+P` → "GitHub Copilot: Check Status"
- Deve mostrar: "GitHub Copilot is active"

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

Dependências instaladas:
- `@modelcontextprotocol/sdk` - SDK MCP oficial
- `axios` - Cliente HTTP
- `zod` - Validação
- `dotenv` - Environment variables

### 3. Gerar API Token do Jira

1. Acesse: https://id.atlassian.com/manage/api-tokens
2. Clique em **"Create API token"**
3. Nome sugerido: `VS Code GitHub Copilot MCP`
4. **Copie o token gerado** (única visualização!)

### 4. Compilar TypeScript

```bash
npm run build
```

Verifique que a pasta `dist/` foi criada:
```bash
ls -la dist/
# Deve listar: index.js, jira-client.js, tools/...
```

### 5. Obter Caminho Absoluto

```bash
cd jira-mcp-server
pwd
```

Anote o resultado (ex: `/Users/pedrohedro/Documents/Trabalho/Claro/jira-mcp-server`)

## ⚙️ Configuração no VS Code

O VS Code suporta **três métodos** de configuração MCP:

### Método 1: User Settings (Configuração Global)

**Recomendado para:** Uso pessoal em todos os projetos

**Abrir User Settings:**
```
Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows/Linux)
Digite: "Preferences: Open User Settings (JSON)"
Enter
```

**Adicionar configuração MCP:**

```json
{
  "github.copilot.chat.mcp.servers": {
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
- Disponível em todos os workspaces
- Uma configuração para tudo
- Simples de gerenciar

**❌ Desvantagens:**
- Credenciais no arquivo global
- Menos flexibilidade

### Método 2: Workspace Settings (Por Projeto)

**Recomendado para:** Equipes, projetos com configs específicas

**Abrir Workspace Settings:**
```
Cmd+Shift+P → "Preferences: Open Workspace Settings (JSON)"
```

Ou criar manualmente:
```bash
cd seu-projeto
mkdir -p .vscode
nano .vscode/settings.json
```

**Adicionar configuração:**

```json
{
  "github.copilot.chat.mcp.servers": {
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

**Proteger credenciais:**
```bash
echo ".vscode/settings.json" >> .gitignore
```

**✅ Vantagens:**
- Config específica por projeto
- Ideal para equipes
- Controle granular

**❌ Desvantagens:**
- Configurar em cada projeto
- Gerenciar múltiplos arquivos

### Método 3: Environment Variables (Mais Seguro)

**Recomendado para:** Máxima segurança, compartilhamento em equipe

**1. Criar arquivo `.env` no projeto:**
```bash
cd seu-projeto
nano .env
```

Conteúdo:
```env
JIRA_URL=https://clarodigital.atlassian.net
JIRA_EMAIL=pedro.hedro.glo@gcp.clarobrasil.mobi
JIRA_API_TOKEN=ATATT3xFfGF0Ue7auMqvIc16WRvg1xP7LkTZMAicue7DkvFF07iMW4-ZJBkw5pWcxbjconYb93DPvPORPNchSL1aGxbfrcd9YOutXxwWid6NKi0yR4g5Zzqr6jFqruKK2_uDTBRByD74cGGP7E045ki-TNLz-6BEFFy0U00b2JcUF1S6PAqt8Yw=3B9C8EEC
```

**2. Configurar `.vscode/settings.json` para usar variáveis:**
```json
{
  "github.copilot.chat.mcp.servers": {
    "jira-claro": {
      "command": "node",
      "args": ["/Users/pedrohedro/Documents/Trabalho/Claro/jira-mcp-server/dist/index.js"]
    }
  }
}
```

**3. MCP server lerá do `.env` automaticamente** (já configurado no código!)

**4. Proteger arquivos sensíveis:**
```bash
echo ".env" >> .gitignore
```

**5. Criar template para equipe:**
```bash
cp .env .env.example
# Editar .env.example e remover valores reais
```

**✅ Vantagens:**
- Máxima segurança
- Fácil compartilhar (template)
- Padrão de mercado

**❌ Desvantagens:**
- Configuração adicional
- Variáveis devem estar disponíveis

## 🔐 Habilitar MCP no GitHub Copilot (Empresas)

**Para usuários de Copilot Business/Enterprise:**

Se você está em uma organização, o administrador deve habilitar a política MCP:

1. Acesse: https://github.com/organizations/TechTeam-ClaroEmpresas/settings/copilot
2. Navegue até **"Policies"**
3. Encontre **"MCP servers in Copilot"**
4. Habilite: **"Allowed"** ou **"Enabled"**
5. Salve as mudanças

**Verificar se está habilitado:**
```
No VS Code:
Cmd+Shift+P → "GitHub Copilot: Check Status"
Deve mencionar "MCP: Enabled"
```

## 🔄 Recarregar VS Code

Após configurar:

**Opção 1: Reload Window**
```
Cmd+Shift+P → "Developer: Reload Window"
```

**Opção 2: Reiniciar VS Code**
```
Feche completamente e abra novamente
```

## ✅ Verificar que Funcionou

### 1. Abrir GitHub Copilot Chat

**Atalhos:**
- `Cmd+I` (Mac) / `Ctrl+I` (Windows/Linux) - Chat inline
- `Cmd+Shift+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux) - Chat sidebar

Ou clique no ícone do Copilot (💬) na Activity Bar

### 2. Testar Conexão Jira

No chat do Copilot, digite:

```
Liste meus projetos Jira
```

**Resposta esperada:**
```
🤖 GitHub Copilot: [usando jira-claro MCP server]

📋 Found X projects in Jira:

**CCOE** - CCoE - Cloud Center of Excellence (software)
**EM** - Embaixadores (software)
**DA** - JEDI - DATAHUB (software)
...
```

### 3. Verificar MCP Tools Disponíveis

No chat:
```
Quais ferramentas Jira você tem disponível?
```

**Resposta esperada:**
```
Tenho 10 ferramentas do Jira MCP Server:

📋 Queries (6 tools):
- list_my_tasks: Lista todas suas tarefas
- list_subtasks: Lista subtarefas com filtros
- list_sprint_active: Tarefas da sprint ativa
- list_in_development: Tarefas em desenvolvimento
- list_projects: Lista projetos disponíveis
- custom_query: Executa JQL customizado

⏱️ Worklogs (2 tools):
- add_worklog: Registra tempo em uma issue
- list_worklogs: Ver registros de tempo

💬 Comments (2 tools):
- add_comment: Adiciona comentário
- list_comments: Ver comentários
```

### 4. Testar Agent Mode

```
@workspace Analise meu código, encontre issues relacionadas no Jira e registre 1 hora de trabalho
```

Copilot deve executar múltiplas ações automaticamente!

## 💬 Exemplos de Uso no VS Code

### Consulta Básica

```
👤 Você: "Mostre minhas subtarefas da sprint ativa"

🤖 Copilot: [usa list_subtasks do MCP]
📋 Found 5 subtasks:

**CCOE-82835** - Implementar políticas de branch protection
  Status: To Development | Priority: Medium
  Updated: 2025-10-06

**CCOE-82834** - Configurar templates de PR
  Status: To Development | Priority: Medium
  Updated: 2025-10-06
...
```

### Registrar Tempo

```
👤 Você: "Adicione 2h 30m de worklog em CCOE-82835 com comentário 'Desenvolvimento da feature'"

🤖 Copilot: [usa add_worklog]
✅ Worklog added successfully!
Issue: CCOE-82835
Time: 2h 30m
Comment: Desenvolvimento da feature
```

### Workflow com Contexto do Código

```python
# main.py
# TODO: CCOE-82835 - Implementar validação de branch

def validate_branch_name(name: str) -> bool:
    """Valida nome de branch segundo padrões"""
    pass
```

```
👤 Você (no chat): "Analise o TODO neste arquivo e me dê mais detalhes da issue"

🤖 Copilot:
[detecta CCOE-82835 no código]
[usa list_my_tasks com filtro]

📋 **CCOE-82835**: Implementar políticas de branch protection
Status: To Development
Priority: Medium
Assignee: pedro.hedro@globalhitss.com.br

Description:
[mostra descrição completa da issue]

Posso ajudar a implementar a validação!
```

### Agent Mode Avançado

```
👤 Você: "@workspace Encontre todas as issues mencionadas nos últimos 10 commits, liste-as do Jira e me dê um resumo"

🤖 Copilot:
[analisa git log]
[encontra: CCOE-82835, CCOE-82834, CCOE-81549]
[usa custom_query para buscar essas issues]
[gera resumo]

📊 Resumo das Issues nos Últimos Commits:

1. CCOE-82835 - Branch Protection (5 commits)
   Status: To Development

2. CCOE-82834 - PR Templates (3 commits)
   Status: To Development

3. CCOE-81549 - Security Gates (2 commits)
   Status: Done ✅

Recomendação: Focar em CCOE-82835 que tem mais commits pendentes.
```

### Query JQL Customizada

```
👤 Você: "Execute a query: project = CCOE AND created >= -7d AND type = Sub-task ORDER BY created DESC"

🤖 Copilot: [usa custom_query]
📋 Found 8 issues created in last 7 days:

**CCOE-82836** - Revisar conexão AWS (2025-10-04)
**CCOE-82835** - Branch protection (2025-10-04)
...
```

## 🎯 Features Exclusivas do VS Code + Copilot

### 1. Agent Mode (Preview)

O Copilot Agent pode executar múltiplas tarefas autonomamente:

```
👤 Você: "@workspace Faça code review do último commit, encontre a issue Jira relacionada, registre tempo e adicione comentário com o que foi revisado"

🤖 Copilot:
Step 1: [analisa git diff]
Step 2: [identifica CCOE-82835]
Step 3: [usa add_worklog → 1h]
Step 4: [usa add_comment → "Code review: implementado sistema de validação..."]
Step 5: [apresenta resumo]

✅ Concluído!
```

### 2. MCP Resources Integration

Copilot pode acessar recursos contextuais:

```json
// MCP Resources disponíveis:
{
  "resources": [
    "jira://projects",          // Lista de projetos
    "jira://my-tasks",          // Suas tarefas
    "jira://sprint-active"      // Sprint atual
  ]
}
```

```
👤 Você: "@jira://sprint-active Quais tarefas devo priorizar hoje?"

🤖 Copilot: [acessa resource automaticamente]
Com base nas 5 subtarefas da sprint:

Prioridade 1: CCOE-82835 (bloqueando outras)
Prioridade 2: CCOE-82834 (dependência)
...
```

### 3. Inline Chat com Contexto Jira

```python
# main.py
def validate_branch():  # [cursor aqui]
    pass
```

```
Você: Cmd+I (inline chat)
"Implemente essa função conforme CCOE-82835"

Copilot:
[busca CCOE-82835 via MCP]
[lê requisitos]
[gera código inline]

def validate_branch(name: str) -> bool:
    """
    Valida nome de branch segundo padrões definidos em CCOE-82835

    Padrões aceitos:
    - feature/ISSUE-123-description
    - fix/ISSUE-123-description
    - hotfix/ISSUE-123-description
    """
    pattern = r'^(feature|fix|hotfix)/[A-Z]+-\d+-[\w-]+$'
    return bool(re.match(pattern, name))
```

### 4. GitHub MCP Registry (1-Click Install)

**Futuro:** Quando publicado no registry:

```
Cmd+Shift+P → "GitHub Copilot: Add MCP Server"
Buscar: "jira-claro"
Clicar: "Install"
[OAuth automático]
✅ Configurado!
```

## 🐛 Troubleshooting

### Problema: MCP Server não aparece

**Sintomas:**
- Copilot não reconhece comandos Jira
- Nenhuma tool MCP disponível

**Soluções:**

1. **Verificar versão do VS Code:**
   ```bash
   code --version
   # Primeira linha deve ser >= 1.102
   ```

2. **Verificar configuração:**
   ```
   Cmd+Shift+P → "Preferences: Open User Settings (JSON)"
   # Procurar por "github.copilot.chat.mcp.servers"
   ```

3. **Validar JSON:**
   ```bash
   # Copiar conteúdo do settings.json
   node -e "console.log(JSON.parse(process.argv[1]))" '{"github.copilot.chat.mcp.servers": {...}}'
   ```

4. **Verificar caminho do MCP server:**
   ```bash
   ls -la /caminho/do/args/dist/index.js
   # Deve existir!
   ```

5. **Reload Window:**
   ```
   Cmd+Shift+P → "Developer: Reload Window"
   ```

6. **Verificar output do MCP:**
   ```
   View → Output → Selecionar "GitHub Copilot Chat"
   # Ver logs de inicialização do MCP
   ```

### Problema: Política MCP Desabilitada (Empresas)

**Sintomas:**
- Erro: "MCP servers are disabled by your organization"

**Soluções:**

1. **Verificar status:**
   ```
   Cmd+Shift+P → "GitHub Copilot: Check Status"
   ```

2. **Contatar admin da organização:**
   ```
   Solicitar habilitação da política:
   GitHub Org Settings → Copilot → Policies
   → "MCP servers in Copilot" = Allowed
   ```

3. **Usar conta pessoal (temporário):**
   ```
   Cmd+Shift+P → "GitHub Copilot: Sign Out"
   Logar com conta pessoal que não tem restrições
   ```

### Problema: Erro de Autenticação Jira

**Sintomas:**
- "401 Unauthorized"
- "Invalid API token"

**Soluções:**

1. **Verificar credenciais:**
   ```bash
   # Se usando .env
   cat .env

   # Se usando settings.json
   cat .vscode/settings.json | grep JIRA_
   ```

2. **Testar credenciais manualmente:**
   ```bash
   curl -u "email@claro.com.br:TOKEN" \
     https://clarodigital.atlassian.net/rest/api/3/myself

   # Deve retornar seus dados do usuário
   ```

3. **Gerar novo token:**
   - https://id.atlassian.com/manage/api-tokens
   - Create API token
   - Atualizar em settings.json ou .env

4. **Reload após mudanças:**
   ```
   Cmd+Shift+P → "Developer: Reload Window"
   ```

### Problema: Node.js não encontrado

**Sintomas:**
- "command not found: node"
- MCP server não inicia

**Soluções:**

1. **Verificar Node.js:**
   ```bash
   which node
   # Deve mostrar: /usr/local/bin/node
   ```

2. **Usar caminho absoluto:**
   ```json
   {
     "github.copilot.chat.mcp.servers": {
       "jira-claro": {
         "command": "/usr/local/bin/node",
         "args": ["/caminho/dist/index.js"]
       }
     }
   }
   ```

3. **Adicionar ao PATH:**
   ```bash
   # Mac/Linux
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **Reinstalar Node.js:**
   ```bash
   # Mac
   brew install node

   # Linux
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

### Problema: MCP Server Crasheando

**Sintomas:**
- Tools param após alguns minutos
- Errors intermitentes
- VS Code trava ao usar Jira

**Soluções:**

1. **Ver logs do Copilot:**
   ```
   View → Output → "GitHub Copilot Chat"
   # Procurar por erros do MCP server
   ```

2. **Testar MCP standalone:**
   ```bash
   cd jira-mcp-server
   node dist/index.js
   # Deve mostrar: "Jira MCP Server running on stdio"
   # Testar stdin/stdout
   # Ctrl+C para sair
   ```

3. **Aumentar timeout:**
   ```json
   {
     "github.copilot.chat.mcp.servers": {
       "jira-claro": {
         "command": "node",
         "args": ["/caminho/dist/index.js"],
         "timeout": 60000
       }
     }
   }
   ```

4. **Verificar memória:**
   ```bash
   # Aumentar heap do Node.js
   export NODE_OPTIONS="--max-old-space-size=4096"
   # Reload VS Code
   ```

### Problema: Performance Lenta

**Sintomas:**
- Respostas lentas do MCP
- VS Code congela ao usar Jira tools

**Soluções:**

1. **Limitar resultados:**
   ```
   Liste apenas 10 tarefas da sprint
   ```

2. **Queries específicas:**
   ```
   Execute JQL: project = CCOE AND sprint in openSprints() LIMIT 10
   ```

3. **Desabilitar extensões conflitantes:**
   ```
   Cmd+Shift+P → "Extensions: Disable All Installed Extensions"
   Habilitar apenas: GitHub Copilot + MCP essenciais
   ```

4. **Ver resource usage:**
   ```
   Cmd+Shift+P → "Developer: Show Running Extensions"
   # Identificar extensões pesadas
   ```

## 🔒 Segurança

### Proteger Credenciais

**Método 1: .env (Recomendado)**

```bash
# 1. Criar .env
cat > .env << 'EOF'
JIRA_URL=https://clarodigital.atlassian.net
JIRA_EMAIL=seu-email@claro.com.br
JIRA_API_TOKEN=seu-token
EOF

# 2. Proteger permissões
chmod 600 .env

# 3. Adicionar ao .gitignore
echo ".env" >> .gitignore

# 4. Criar template
cp .env .env.example
sed -i '' 's/ATATT.*/SEU_TOKEN_AQUI/g' .env.example
```

**Método 2: Workspace Settings**

```bash
# 1. Adicionar ao .gitignore
echo ".vscode/settings.json" >> .gitignore

# 2. Criar template
cp .vscode/settings.json .vscode/settings.json.example

# 3. Remover credenciais do template
# Editar manualmente
```

**Verificar o que será commitado:**

```bash
git status --ignored
# Não deve listar .env ou .vscode/settings.json com credenciais
```

### Revogar Token Comprometido

Se seu token vazar:

1. **Revogar imediatamente:**
   - https://id.atlassian.com/manage/api-tokens
   - Localizar token → **Revoke**

2. **Gerar novo:**
   - Create API token
   - Copiar novo token

3. **Atualizar em todos os lugares:**
   ```bash
   # .env
   nano .env

   # Ou settings.json
   code .vscode/settings.json
   ```

4. **Reload VS Code:**
   ```
   Cmd+Shift+P → "Developer: Reload Window"
   ```

5. **Verificar histórico Git:**
   ```bash
   # Se token foi commitado por engano
   git log -p | grep "ATATT"
   # Se encontrou, fazer rewrite history
   ```

## 🤝 Compartilhar com Equipe

### Setup para Colegas

**Documentação rápida:**

```markdown
# Jira MCP para VS Code - Quick Start

## 1. Pré-requisitos
- VS Code 1.102+
- GitHub Copilot ativo
- Node.js 18+

## 2. Clone o servidor MCP
git clone https://github.com/TechTeam-ClaroEmpresas/jira-mcp-server
cd jira-mcp-server
npm install
npm run build

## 3. Configure credenciais
cp .env.example .env
nano .env
# Adicionar suas credenciais Jira

## 4. Configure VS Code
Copiar .vscode/settings.json.example para seu projeto
Ajustar caminho do MCP server
Reload Window

## 5. Testar
Abrir Copilot Chat: Cmd+Shift+I
Digitar: "Liste meus projetos Jira"
```

### Template de Configuração

**`.vscode/settings.json.example`:**

```json
{
  "github.copilot.chat.mcp.servers": {
    "jira-claro": {
      "command": "node",
      "args": ["/ALTERE/PARA/SEU/CAMINHO/jira-mcp-server/dist/index.js"]
    }
  }
}
```

**`.env.example`:**

```env
JIRA_URL=https://clarodigital.atlassian.net
JIRA_EMAIL=SEU_EMAIL@claro.com.br
JIRA_API_TOKEN=SEU_TOKEN_AQUI
```

**Instruções para colegas:**

1. Copiar `.env.example` → `.env`
2. Gerar próprio API token
3. Preencher `.env` com suas credenciais
4. Copiar `.vscode/settings.json.example` → `.vscode/settings.json`
5. Ajustar caminho absoluto do MCP server
6. **NUNCA** commitar arquivos com credenciais!

## 📊 Comparação: VS Code vs Claude Code vs Cursor

| Feature | VS Code + Copilot | Claude Code | Cursor |
|---------|-------------------|-------------|--------|
| **MCP Version** | v1.102+ (GA) | Native | Native |
| **Config File** | `settings.json` | `claude_desktop_config.json` | `.cursor/mcp.json` |
| **Project Config** | ✅ Workspace | ❌ Global only | ✅ Per-project |
| **Agent Mode** | ✅ Preview | ✅ Full | ✅ Full |
| **MCP Registry** | ✅ GitHub | ❌ | ✅ Curated |
| **Hot Reload** | ✅ Reload Window | ❌ Full restart | ✅ Reload Window |
| **Inline Chat** | ✅ Cmd+I | ✅ Natural | ✅ Natural |
| **Context Awareness** | ✅ Good | ✅ Excellent | ✅ Excellent |
| **Performance** | ✅ Fast | ✅ Fast | ✅ Fast |
| **Enterprise Policies** | ✅ Org-level | ❌ | 🟡 Limited |

## 📚 Recursos Adicionais

- **VS Code MCP Docs**: https://code.visualstudio.com/docs/copilot/customization/mcp-servers
- **GitHub Copilot Docs**: https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp
- **MCP Protocol**: https://modelcontextprotocol.io
- **Jira API**: https://developer.atlassian.com/cloud/jira/platform/rest/v3/
- **Tools Reference**: [TOOLS.md](./TOOLS.md)

## 🎓 Dicas Avançadas

### 1. Workspace Multi-MCP

Configure múltiplos MCP servers:

```json
{
  "github.copilot.chat.mcp.servers": {
    "jira-claro": {
      "command": "node",
      "args": ["/path/jira-mcp-server/dist/index.js"]
    },
    "confluence": {
      "command": "node",
      "args": ["/path/confluence-mcp/dist/index.js"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

### 2. Keybindings Customizados

**File: `keybindings.json`**

```json
[
  {
    "key": "cmd+shift+j",
    "command": "workbench.action.chat.open",
    "args": "Liste minhas tarefas da sprint ativa"
  },
  {
    "key": "cmd+shift+l",
    "command": "workbench.action.chat.open",
    "args": "Registre 1h na última issue mencionada"
  }
]
```

### 3. Tasks Integration

**File: `.vscode/tasks.json`**

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Jira: Daily Standup",
      "type": "shell",
      "command": "code --command 'workbench.action.chat.open' --args 'Gere relatório das minhas tarefas de ontem, hoje e blockers'",
      "problemMatcher": []
    }
  ]
}
```

### 4. Snippets para Jira

**File: `.vscode/jira.code-snippets`**

```json
{
  "Jira Sprint Tasks": {
    "prefix": "jira-sprint",
    "body": [
      "// Cmd+Shift+I para abrir chat",
      "// Pergunta: Liste minhas subtarefas da sprint ativa",
      "// Issue: $1",
      "$0"
    ]
  },
  "Jira Log Time": {
    "prefix": "jira-log",
    "body": [
      "// TODO: Registrar ${1:2h} em ${2:ISSUE-KEY}",
      "// Descrição: $3",
      "$0"
    ]
  }
}
```

## 🔄 Atualizar MCP Server

```bash
cd jira-mcp-server

# Atualizar código
git pull

# Reinstalar dependências
npm install

# Recompilar
npm run build

# Reload VS Code
# Cmd+Shift+P → "Developer: Reload Window"
```

## 🌟 Workflow Recomendado

### Morning Standup

```
1. Abrir VS Code
2. Cmd+Shift+I (Chat)
3. "Gere relatório: tarefas finalizadas ontem, planejadas hoje, blockers"
4. [Copilot busca no Jira via MCP]
5. Copiar e colar no Slack/Teams
```

### Durante Desenvolvimento

```
1. Trabalhar no código
2. Cmd+I (inline) → "Implementar conforme ISSUE-KEY"
3. [Copilot busca requisitos no Jira]
4. Desenvolver com contexto
5. Ao finalizar: "Registre tempo e adicione comentário na issue"
```

### Code Review

```
1. Analisar PR
2. Chat: "Busque issues relacionadas a este diff"
3. [Copilot analisa commits e busca no Jira]
4. Review com contexto completo
5. "Adicione comentário nas issues com resultado do review"
```

---

**✅ Setup Completo!** Você está pronto para usar Jira integrado ao GitHub Copilot no VS Code!

**Próximos passos:**
- Explore [Agent Mode](#1-agent-mode-preview)
- Configure [keybindings customizados](#2-keybindings-customizados)
- Compartilhe com sua [equipe](#-compartilhar-com-equipe)
- Veja todos os [10 tools disponíveis](./TOOLS.md)

**Made with ❤️ by Claro Digital Team - CCoE**
