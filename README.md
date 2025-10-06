# 🚀 Jira MCP Server - Claro Digital

**Model Context Protocol (MCP) server for Jira integration** - permite gerenciar suas tarefas Jira diretamente através do Claude de forma conversacional.

## 🎯 O que é isso?

Este é um **MCP Server** que conecta o Claude ao Jira da Claro Digital, permitindo:

- 📋 Consultar suas tarefas e subtarefas
- ⏱️ Registrar tempo trabalhado (worklogs)
- 💬 Adicionar comentários para rastreabilidade
- 🔍 Executar queries JQL personalizadas

Tudo através de **conversação natural** com o Claude!

## ✨ Funcionalidades

### 10 Tools Disponíveis:

**Queries (6 tools)**:
- `list_my_tasks` - Lista todas suas tarefas
- `list_subtasks` - Lista subtarefas (com filtros)
- `list_sprint_active` - Tarefas da sprint ativa
- `list_in_development` - Tarefas em desenvolvimento
- `list_projects` - Lista projetos disponíveis
- `custom_query` - Execute JQL customizado

**Worklogs (2 tools)**:
- `add_worklog` - Registrar tempo em uma issue
- `list_worklogs` - Ver registros de tempo

**Comments (2 tools)**:
- `add_comment` - Adicionar comentário
- `list_comments` - Ver comentários

## 🏗️ Arquitetura

```
jira-mcp-server/
├── src/
│   ├── index.ts           # MCP Server principal
│   ├── jira-client.ts     # Client da API Jira
│   ├── tools/
│   │   ├── queries.ts     # Tools de queries
│   │   ├── worklog.ts     # Tools de worklog
│   │   └── comments.ts    # Tools de comments
│   └── types/
│       └── jira.ts        # TypeScript types
├── dist/                  # Código compilado
├── package.json
├── tsconfig.json
├── .env                   # Suas credenciais (não commitar!)
└── .env.example           # Template
```

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd jira-mcp-server
npm install
```

### 2. Configurar Credenciais

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Edite `.env`:
```env
JIRA_URL=https://clarodigital.atlassian.net
JIRA_EMAIL=seu-email@claro.com.br
JIRA_API_TOKEN=seu-token-aqui
```

**Gerar API Token**: https://id.atlassian.com/manage/api-tokens

### 3. Compilar TypeScript

```bash
npm run build
```

### 4. Configurar no Claude Code

Edite `~/.config/claude/claude_desktop_config.json` (ou `~/Library/Application Support/Claude/claude_desktop_config.json` no Mac):

```json
{
  "mcpServers": {
    "jira-claro": {
      "command": "node",
      "args": ["/caminho/absoluto/para/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "https://clarodigital.atlassian.net",
        "JIRA_EMAIL": "seu-email@claro.com.br",
        "JIRA_API_TOKEN": "seu-token-aqui"
      }
    }
  }
}
```

**Importante**: Use o caminho absoluto para o arquivo `dist/index.js`!

### 5. Reiniciar Claude Code

Feche e abra o Claude Code novamente para carregar o MCP server.

## 💬 Exemplos de Uso

Após configurar, você pode conversar com o Claude assim:

```
Você: "Mostre minhas subtarefas da sprint atual"

Claude: [usa list_subtasks]
📋 Found 6 subtasks:

**CCOE-82835**: Implementar políticas de branch protection
Status: To Development | Priority: Medium | Assignee: pedro.hedro...
Updated: 2025-10-06

**CCOE-82834**: Configurar templates de PR
Status: To Development | Priority: Medium | Assignee: pedro.hedro...
Updated: 2025-10-06
...
```

```
Você: "Adicione 2 horas de worklog em CCOE-82835 com comentário 'Desenvolvimento da feature'"

Claude: [usa add_worklog]
✅ Worklog added successfully to **CCOE-82835**
⏱️  Time logged: 2h (2h 0m)
💬 Comment: Desenvolvimento da feature
```

```
Você: "Adicione comentário em CCOE-82835: 'Iniciando desenvolvimento'"

Claude: [usa add_comment]
✅ Comment added successfully to **CCOE-82835**
👤 Author: pedro.hedro@globalhitss.com.br
📅 Created: 2025-10-06
💬 Comment: Iniciando desenvolvimento
```

## 📚 Documentação Detalhada

- **[SETUP.md](./SETUP.md)** - Guia completo de instalação e configuração
- **[TOOLS.md](./TOOLS.md)** - Documentação de cada tool disponível
- **[SHARING.md](./SHARING.md)** - Como compartilhar com sua equipe

## 🤝 Compartilhamento com Colegas

### Opção 1: Local Install (Mais Simples)

1. Compartilhe o repositório:
```bash
zip -r jira-mcp-server.zip jira-mcp-server/
# Enviar arquivo para colegas
```

2. Colegas descompactam e seguem Quick Start

### Opção 2: Git Clone

```bash
git clone https://github.com/TechTeam-ClaroEmpresas/jira-mcp-server
cd jira-mcp-server
npm install
cp .env.example .env
# Editar .env com credenciais
npm run build
# Configurar no claude_desktop_config.json
```

### Opção 3: NPM (Futuro)

*Planejado para publicação no npm interno da Claro*

## 🔒 Segurança

- ✅ **Credenciais via `.env`** - Nunca hardcode tokens
- ✅ **`.gitignore` configurado** - `.env` nunca é commitado
- ✅ **HTTPS-only** - Comunicação segura com API Jira
- ✅ **Token pessoal** - Cada pessoa usa seu próprio token

## 🛠️ Desenvolvimento

### Scripts Disponíveis

```bash
npm run build       # Compilar TypeScript
npm run watch       # Compilar em modo watch
npm run dev         # Rodar em modo desenvolvimento
```

### Estrutura de Tools

Cada tool segue o padrão:

```typescript
{
  description: string,
  inputSchema: z.object({...}),  // Validação com Zod
  handler: async (args) => {
    // Lógica do tool
    return {
      content: [{ type: 'text', text: '...' }]
    };
  }
}
```

## 🐛 Troubleshooting

### MCP Server não aparece no Claude

1. Verifique o caminho em `claude_desktop_config.json`
2. Use caminho absoluto (não relativo)
3. Reinicie o Claude Code completamente
4. Verifique logs em `~/Library/Logs/Claude/mcp*.log` (Mac)

### Erro de Autenticação

1. Verifique se o `.env` está preenchido corretamente
2. Gere um novo API token: https://id.atlassian.com/manage/api-tokens
3. Certifique-se que o email está correto

### Tools não funcionam

1. Verifique se você tem permissão na issue
2. Para worklog: use formato correto ("2h 30m", "1d", etc)
3. Veja logs para mensagens de erro detalhadas

## 📊 Tecnologias Usadas

- **TypeScript** - Type safety
- **@modelcontextprotocol/sdk** - SDK oficial MCP
- **axios** - HTTP client
- **zod** - Schema validation
- **dotenv** - Environment variables

## 🎓 Learn More

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Jira REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Claude Code Documentation](https://docs.claude.com/)

## 👥 Autores

- **Pedro Hedro** - *Initial work* - pedro.hedro@globalhitss.com.br
- **Claro Digital Team** - CCoE

## 📝 License

MIT

---

**Made with ❤️  by Claro Digital Team**
