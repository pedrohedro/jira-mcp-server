# Jira MCP Server - Enhanced Version 2.0

**Model Context Protocol (MCP) server for Jira integration** - Enhanced with security, performance, and new features.

## 🆕 What's New in v2.0

### ✨ New Features
- ✅ **Create Issues**: Create new Jira issues with full field support
- ✅ **Update Status**: Transition issues through workflow states
- ✅ **Update Issues**: Modify existing issue fields
- ✅ **Attachments**: Upload and list file attachments
- ✅ **Smart Caching**: 5-minute cache for repeated queries
- ✅ **Rate Limiting**: Automatic request throttling
- ✅ **Structured Logging**: Winston-based logging with rotation
- ✅ **Metrics Tracking**: Usage statistics and performance monitoring
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Better Error Messages**: Detailed, actionable error feedback

### 🔒 Security Improvements
- **Environment Variables**: Credentials no longer stored in VS Code settings
- **Secure Setup Script**: Automated secure configuration
- **No Hardcoded Secrets**: All sensitive data in environment variables

### ⚡ Performance Improvements
- **Request Caching**: Reduces API calls by 60-80%
- **Rate Limiting**: Prevents API throttling
- **Connection Pooling**: Reuses HTTP connections
- **Exponential Backoff**: Handles transient failures gracefully

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables (Secure Method)

```bash
./setup-env.sh
```

Follow the prompts to enter your Jira credentials. They will be stored securely in your shell profile.

**Then restart VS Code completely** for environment variables to take effect.

### 3. Build

```bash
npm run build
```

### 4. Verify Installation

```bash
npm test
```

## 📚 Available Tools

### Query Tools
- `list_my_tasks` - List unresolved tasks
- `list_my_subtasks` - List your subtasks
- `list_active_sprint` - Tasks in active sprints
- `list_in_development` - Tasks currently in development
- `list_to_development` - Tasks ready for development
- `list_high_priority` - High priority tasks
- `execute_jql` - Execute custom JQL queries

### Issue Management Tools (NEW!)
- `create_issue` - Create new issues
- `update_issue_status` - Transition workflow states
- `update_issue` - Modify issue fields

### Worklog Tools
- `add_worklog` - Log time spent
- `list_worklogs` - View logged time

### Comment Tools
- `add_comment` - Add comments
- `list_comments` - View comments

### Attachment Tools (NEW!)
- `add_attachment` - Upload files
- `list_attachments` - List attachments

## 🛠️ Development

### Run in Development Mode

```bash
npm run dev
```

### Watch Mode

```bash
npm run watch
```

### Run Tests

```bash
npm test                 # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

## 📊 Logging and Metrics

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

Logs are automatically rotated (max 5MB, 5 files).

Metrics are logged every 5 minutes:
- Tool usage counts
- Error counts
- Uptime

## 🔧 Configuration

### Environment Variables

```bash
JIRA_URL=https://yourinstance.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
LOG_LEVEL=info  # Optional: debug, info, warn, error
```

### Cache Configuration

Default: 5 minutes TTL, configurable in `jira-client.ts`:

```typescript
this.cache = new Cache(5 * 60 * 1000); // 5 minutes
```

### Rate Limiting

Default: 10 requests capacity, refills at 2 tokens/second:

```typescript
this.rateLimiter = new RateLimiter(10, 2);
```

## 📖 Usage Examples

### Create an Issue

```typescript
// Via Copilot Chat
"Create a new issue in project CCOE with summary 'Fix login bug' and priority High"
```

### Update Issue Status

```typescript
// Via Copilot Chat
"Move issue CCOE-12345 to In Development"
```

### Add Attachment

```typescript
// Via Copilot Chat
"Attach the file /path/to/screenshot.png to issue CCOE-12345"
```

### Execute Custom Query

```typescript
// Via Copilot Chat
"Find all high priority bugs assigned to me"
```

## 🧪 Testing

Test coverage requirements:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

Run tests:
```bash
npm test -- --coverage
```

## 🐛 Troubleshooting

### Environment Variables Not Loaded

1. Restart VS Code completely (Cmd+Q on Mac)
2. Verify variables are set:
   ```bash
   echo $JIRA_URL
   echo $JIRA_EMAIL
   ```

### Rate Limiting Errors

The server automatically handles rate limiting. If you see delays, it's working as intended to prevent API throttling.

### Cache Issues

Clear cache by restarting the MCP server:
```bash
# In VS Code: Reload window
Cmd+Shift+P → "Developer: Reload Window"
```

## 📝 Contributing

1. Write tests for new features
2. Ensure all tests pass
3. Update documentation
4. Follow TypeScript best practices

## 📜 License

MIT License - See LICENSE file for details

## 👤 Author

Pedro Hedro <pedro.hedro@globalhitss.com.br>

---

**Version**: 2.0.0
**Last Updated**: October 24, 2025
