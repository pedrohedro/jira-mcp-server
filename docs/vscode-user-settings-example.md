# VS Code User Settings — MCP server example

This example shows how to add the Jira MCP server to your **User Settings** in VS Code so the server is available in all workspaces.

> Security note: adding credentials in User Settings is less secure. Prefer using `.env` or workspace settings if possible.

## Steps

1. Open VS Code.
2. Open Command Palette: `Cmd+Shift+P` (mac) / `Ctrl+Shift+P` (win/linux).
3. Run: `Preferences: Open User Settings (JSON)`.
4. Paste the snippet below and save.

## Snippet (copy-paste)

```json
{
  "github.copilot.chat.mcp.servers": {
    "jira-claro": {
      "command": "node",
      "args": ["/Users/pedrohedro/Documents/Trabalho/Claro/github templates/jira-mcp-server/dist/index.js"],
      "env": {
        "JIRA_URL": "https://clarodigital.atlassian.net",
        "JIRA_EMAIL": "pedro.hedro.glo@gcp.clarobrasil.mobi",
        "JIRA_API_TOKEN": "<PASTE_YOUR_JIRA_API_TOKEN_HERE>"
      }
    }
  }
}
```

- After saving, reload VS Code: `Cmd+Shift+P` → `Developer: Reload Window`.
- To avoid committing credentials, add the following to your global `.gitignore` if you store settings in a dotfile:

```bash
# Avoid committing VS Code user settings with secrets
.vscode/settings.json
```

---

If you want, I can instead add a short script that prints the absolute `dist` path to make copying the `args` easier on other machines.