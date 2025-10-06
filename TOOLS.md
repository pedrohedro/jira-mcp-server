# 🛠️ Jira MCP Server - Documentação dos Tools

Este documento lista todos os 10 tools disponíveis no MCP server.

## 📋 Query Tools (6)

### 1. `list_my_tasks`
Lista todas as tarefas não resolvidas atribuídas a você.

**Parâmetros**:
- `maxResults` (opcional): Número máximo de resultados (padrão: 50)

**Exemplo de uso**:
> "Liste minhas tarefas"
> "Mostre minhas issues abertas"

### 2. `list_subtasks`
Lista subtarefas atribuídas a você com filtros opcionais.

**Parâmetros**:
- `status` (opcional): 'all', 'In Development', 'To Development' (padrão: 'all')
- `sprint` (opcional): Apenas da sprint ativa (padrão: true)

**Exemplos**:
> "Mostre minhas subtarefas da sprint"
> "Liste subtarefas em desenvolvimento"
> "Quais subtarefas estão 'To Development'?"

### 3. `list_sprint_active`
Lista todas as tarefas da sprint ativa.

**Parâmetros**:
- `maxResults` (opcional): Máximo de resultados (padrão: 50)

**Exemplos**:
> "Mostre tarefas da sprint atual"
> "O que tenho na sprint ativa?"

### 4. `list_in_development`
Lista tarefas com status "In Development".

**Parâmetros**:
- `maxResults` (opcional): Máximo de resultados (padrão: 50)

**Exemplos**:
> "Quais tarefas estou desenvolvendo?"
> "Mostre o que está in development"

### 5. `list_projects`
Lista todos os projetos Jira disponíveis.

**Parâmetros**: Nenhum

**Exemplos**:
> "Liste os projetos"
> "Quais projetos tenho acesso?"

### 6. `custom_query`
Executa query JQL personalizada.

**Parâmetros**:
- `jql` (obrigatório): String de query JQL
- `maxResults` (opcional): Máximo de resultados (padrão: 50)

**Exemplos**:
> "Execute JQL: project = CCOE AND priority = High"
> "Busque: assignee=currentUser() AND status='Done' AND updated >= -7d"

---

## ⏱️ Worklog Tools (2)

### 7. `add_worklog`
Adiciona registro de tempo em uma issue/subtask.

**Parâmetros**:
- `issueKey` (obrigatório): Key da issue (ex: CCOE-12345)
- `timeSpent` (obrigatório): Tempo em formato Jira ("2h 30m", "1d", "3h")
- `comment` (opcional): Comentário para o worklog

**Formatos de tempo aceitos**:
- `30m` - 30 minutos
- `2h` - 2 horas
- `1d` - 1 dia (8 horas)
- `2h 30m` - 2 horas e 30 minutos
- `1d 4h` - 1 dia e 4 horas

**Exemplos**:
> "Adicione 2 horas de worklog em CCOE-82835"
> "Registre 30 minutos em CCOE-12345 com comentário 'Code review'"
> "Logue 1 dia e 2 horas na task CCOE-99999"

### 8. `list_worklogs`
Lista todos os registros de tempo de uma issue.

**Parâmetros**:
- `issueKey` (obrigatório): Key da issue

**Exemplos**:
> "Mostre worklogs de CCOE-82835"
> "Quanto tempo foi registrado em CCOE-12345?"

---

## 💬 Comment Tools (2)

### 9. `add_comment`
Adiciona comentário para rastreabilidade.

**Parâmetros**:
- `issueKey` (obrigatório): Key da issue
- `commentText` (obrigatório): Texto do comentário

**Exemplos**:
> "Adicione comentário em CCOE-82835: 'Iniciando desenvolvimento'"
> "Comente na task CCOE-12345 que foi concluída"

### 10. `list_comments`
Lista todos os comentários de uma issue.

**Parâmetros**:
- `issueKey` (obrigatório): Key da issue

**Exemplos**:
> "Mostre comentários de CCOE-82835"
> "Quais são os comments da task CCOE-12345?"

---

## 💡 Dicas de Uso

### Conversação Natural

O Claude entende linguagem natural. Você pode perguntar de várias formas:

✅ "Mostre minhas tarefas"
✅ "Quais são meus cards?"
✅ "O que tenho pra fazer?"
✅ "Liste minhas issues"

Todas essas formas vão usar o tool `list_my_tasks`.

### Combinações

Você pode pedir múltiplas ações:

> "Liste minhas subtarefas da sprint e depois adicione 2h de worklog na CCOE-82835"

Claude vai:
1. Chamar `list_subtasks`
2. Chamar `add_worklog`

### Contexto

Claude mantém contexto da conversa:

```
Você: "Liste minhas subtarefas"
Claude: [mostra CCOE-82835, CCOE-82834...]

Você: "Adicione 2h na primeira"
Claude: [entende que é CCOE-82835 e adiciona worklog]
```

### Issue Keys

Sempre mencione o issue key completo:
- ✅ CCOE-82835
- ❌ 82835
- ❌ CCOE82835

---

## 🎯 Workflows Comuns

### Daily Standup

```
Você: "Mostre minhas subtarefas em desenvolvimento e as que estão para desenvolver"

Claude: [lista ambas usando list_subtasks com filtros diferentes]
```

### Registro de Trabalho

```
Você: "Adicione 3 horas em CCOE-82835 com comentário 'Implementação completa'"

Claude: [add_worklog]

Você: "Agora adicione comentário dizendo que foi concluído"

Claude: [add_comment usando o mesmo issue key do contexto]
```

### Rastreabilidade

```
Você: "Mostre todos os comentários e worklogs de CCOE-82835"

Claude: [list_comments e list_worklogs]
```

### Busca Avançada

```
Você: "Busque todas as tasks do projeto CCOE com prioridade alta que foram atualizadas nos últimos 3 dias"

Claude: [custom_query com JQL apropriado]
```

---

## 📊 Formato de Resposta

Todos os tools retornam texto formatado em Markdown.

**Exemplo de resposta**:

```
📋 Found 3 subtasks:

**CCOE-82835**: Implementar políticas de branch protection
Status: To Development | Priority: Medium | Assignee: pedro.hedro...
Updated: 2025-10-06

**CCOE-82834**: Configurar templates de PR
Status: To Development | Priority: Medium | Assignee: pedro.hedro...
Updated: 2025-10-06

...
```

---

## 🚀 Exemplos Práticos

Ver arquivo [README.md](./README.md#-exemplos-de-uso) para mais exemplos completos.

---

**Divirta-se gerenciando Jira através do Claude!** 🎉
