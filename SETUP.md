# 🔧 Jira MCP Server - Guia de Setup Completo

Este guia detalha todos os passos para configurar e usar o Jira MCP Server.

## 📋 Pré-requisitos

- **Node.js**: versão 18 ou superior
- **Claude Code**: instalado e funcional
- **Jira Cloud**: acesso à instância da Claro Digital
- **API Token**: da Atlassian (geraremos abaixo)

### Verificar Node.js

```bash
node --version
# Deve mostrar v18.x.x ou superior
```

Se não tiver Node.js, instale de: https://nodejs.org/

## 🚀 Instalação Passo a Passo

### 1. Obter o Código

**Opção A: Git Clone**
```bash
cd ~/Documents/Trabalho/Claro
git clone https://github.com/TechTeam-ClaroEmpresas/jira-mcp-server
cd jira-mcp-server
```

**Opção B: Download ZIP**
```bash
# Descompactar arquivo
cd jira-mcp-server
```

### 2. Instalar Dependências

```bash
npm install
```

Isso instalará:
- `@modelcontextprotocol/sdk` - SDK MCP
- `axios` - Cliente HTTP
- `zod` - Validação
- `dotenv` - Variáveis ambiente
- E dev dependencies (TypeScript, tsx)

### 3. Gerar API Token do Jira

1. Acesse: https://id.atlassian.com/manage/api-tokens
2. Clique em **"Create API token"**
3. Dê um nome: `Claude MCP Server`
4. Copie o token gerado (você só verá uma vez!)

![](https://confluence.atlassian.com/cloud/files/966394452/966394457/1/1555931103584/image2019-4-22_10-51-41.png)

### 4. Configurar Credenciais

Copie o template:
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```bash
nano .env
# ou
code .env  # Se usar VS Code
```

Preencha com suas informações:
```env
JIRA_URL=https://clarodigital.atlassian.net
JIRA_EMAIL=pedro.hedro.glo@gcp.clarobrasil.mobi
JIRA_API_TOKEN=ATATT3xFfGF0Ue7auMqvIc16WRvg1xP7LkTZMAicue7DkvFF07iMW4-ZJBkw5pWcxbjconYb93DPvPORPNchSL1aGxbfrcd9YOutXxwWid6NKi0yR4g5Zzqr6jFqruKK2_uDTBRByD74cGGP7E045ki-TNLz-6BEFFy0U00b2JcUF1S6PAqt8Yw=3B9C8EEC
```

**⚠️ IMPORTANTE**: Nunca compartilhe seu `.env`! Cada pessoa deve usar seu próprio token.

### 5. Compilar TypeScript

```bash
npm run build
```

Isso cria a pasta `dist/` com o código JavaScript compilado.

Verifique que foi criado:
```bash
ls -la dist/
# Deve ver index.js e outros arquivos
```

### 6. Configurar no Claude Code

Precisamos editar o arquivo de configuração do Claude.

**No Mac**:
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**No Linux**:
```bash
code ~/.config/claude/claude_desktop_config.json
```

Adicione a configuração do MCP:

```json
{
  "mcpServers": {
    "jira-claro": {
      "command": "node",
      "args": ["/Users/pedrohedro/Documents/Trabalho/Claro/github templates/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "https://clarodigital.atlassian.net",
        "JIRA_EMAIL": "pedro.hedro.glo@gcp.clarobrasil.mobi",
        "JIRA_API_TOKEN": "ATATT3xFfGF0Ue7auMqvIc16WRvg1xP7LkTZMAicue7DkvFF07iMW4-ZJBkw5pWcxbjconYb93DPvPORPNchSL1aGxbfrcd9YOutXxwWid6NKi0yR4g5Zzqr6jFqruKK2_uDTBRByD74cGGP7E045ki-TNLz-6BEFFy0U00b2JcUF1S6PAqt8Yw=3B9C8EEC"
      }
    }
  }
}
```

**✅ DICA**: Use o caminho absoluto obtido com:
```bash
cd jira-mcp-server
pwd
# Copiar output e adicionar /dist/index.js
```

### 7. Reiniciar Claude Code

**Feche completamente** o Claude Code e abra novamente.

**Mac**: `Cmd + Q` para fechar (não apenas fechar a janela!)

### 8. Verificar que Funcionou

No Claude Code, pergunte:
```
"Liste meus projetos Jira"
```

Claude deve responder com a lista de projetos do Jira!

## ✅ Verificação de Sucesso

Se tudo funcionou, você verá:

1. ✅ MCP server aparece nos logs do Claude
2. ✅ Claude consegue listar projetos
3. ✅ Comandos Jira funcionam

### Verificar Logs

**Mac**:
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

Deve ver:
```
Jira MCP Server running on stdio
```

## 🐛 Troubleshooting

### Problema: MCP Server não aparece

**Solução**:
1. Verifique o caminho em `claude_desktop_config.json`
2. Use caminho absoluto (começando com `/`)
3. Certifique-se que `dist/index.js` existe
4. Reinicie o Claude COMPLETAMENTE

### Problema: Erro de Autenticação

**Solução**:
1. Verifique se `.env` existe e está preenchido
2. Confirme que o email está correto
3. Gere novo API token
4. **NÃO use senha** - use API token!

### Problema: "command not found: node"

**Solução**:
```bash
# Verificar se Node está instalado
which node

# Se não aparecer nada, instale Node.js
brew install node  # Mac
```

### Problema: Compilação falha

**Solução**:
```bash
# Limpar e reinstalar
rm -rf node_modules dist
npm install
npm run build
```

### Problema: Tools não funcionam

**Solução**:
1. Verifique se você tem permissão nas issues
2. Para worklog: formato correto ("2h 30m")
3. Veja logs para erros detalhados

## 🔄 Atualizar para Nova Versão

```bash
cd jira-mcp-server
git pull  # Se usando Git
npm install
npm run build
# Reiniciar Claude Code
```

## 📊 Estrutura de Arquivos

Após setup completo:

```
jira-mcp-server/
├── dist/              ✅ Compilado (criado pelo build)
│   ├── index.js
│   ├── jira-client.js
│   └── tools/...
├── node_modules/      ✅ Dependencies (criado pelo npm install)
├── src/               📝 Código fonte TypeScript
│   ├── index.ts
│   ├── jira-client.ts
│   └── tools/...
├── .env               🔒 SUAS credenciais (não commitar!)
├── .env.example       📋 Template
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Próximos Passos

Após configurar com sucesso:

1. **Teste os tools** - Ver [TOOLS.md](./TOOLS.md)
2. **Explore funcionalidades** - Pergunte ao Claude sobre suas tarefas
3. **Compartilhe com equipe** - Ver próxima seção

## 🤝 Compartilhar com Colegas

Seus colegas devem:

1. **Obter o código** (mesmo jeito que você)
2. **Gerar próprio API token** ⚠️ (não compartilhe o seu!)
3. **Criar próprio `.env`** com suas credenciais
4. **Seguir steps 2-8** deste guia

**Você pode compartilhar**:
- ✅ Código fonte (repo Git)
- ✅ Documentação
- ✅ `.env.example`

**NÃO compartilhe**:
- ❌ Seu `.env`
- ❌ Seu API token
- ❌ Suas credenciais

## 🔐 Segurança

### Proteção do Token

```bash
# Verificar permissões do .env
ls -la .env
# Deve mostrar: -rw------- (só você pode ler/escrever)

# Se não estiver, corrigir:
chmod 600 .env
```

### .gitignore

Se for commitar em Git, verifique que `.env` está no `.gitignore`:

```bash
cat .gitignore | grep .env
# Deve mostrar: .env
```

### Revogar Token

Se seu token vazar:

1. Acesse: https://id.atlassian.com/manage/api-tokens
2. Encontre o token
3. Clique em **Revoke**
4. Gere um novo
5. Atualize `.env`
6. Reinicie Claude

## 📞 Suporte

Se tiver problemas:

1. Verifique [Troubleshooting](#-troubleshooting) acima
2. Veja logs: `~/Library/Logs/Claude/mcp*.log`
3. Contate: pedro.hedro@globalhitss.com.br

---

**Pronto!** ✅ Agora você pode usar Jira através do Claude!
