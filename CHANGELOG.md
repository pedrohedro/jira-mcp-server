# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-12-17

### Added
- **New Tools:**
  - `get_project_issue_types` - List available issue types for a project (with IDs)
  - `get_issue_custom_fields` - Inspect custom fields from an existing issue

- **Enhanced `create_issue`:**
  - `issueTypeId` parameter - Use issue type ID instead of name (required for subtasks in some projects)
  - `descriptionAdf` parameter - Support for rich Atlassian Document Format descriptions
  - Improved custom fields documentation and error messages

### Fixed
- Subtask creation now works by using `issueTypeId` parameter
- Custom fields with select options now properly use `{"id": "OPTION_ID"}` format

## [2.0.0] - 2025-10-24

### Added
- **New Features:**
  - `create_issue` tool - Create new Jira issues with full field support
  - `update_issue_status` tool - Transition issues through workflow states
  - `update_issue` tool - Modify existing issue fields
  - `add_attachment` tool - Upload files to issues
  - `list_attachments` tool - List issue attachments with metadata

- **Performance Improvements:**
  - Smart caching system with 5-minute TTL (reduces API calls by 60-80%)
  - Rate limiter using token bucket algorithm (10 tokens, refill 2/sec)
  - Automatic retry logic with exponential backoff for transient failures

- **Observability:**
  - Winston-based structured logging with log rotation
  - Metrics tracking (tool usage, errors, uptime)
  - Automatic metrics logging every 5 minutes
  - Logs stored in `logs/` directory with 5MB rotation

- **Quality & Testing:**
  - Jest test suite with ESM support
  - Unit tests for cache and rate limiter
  - Test coverage requirements (70% minimum)
  - Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`

### Changed
- **Security:**
  - Credentials moved from VS Code settings to environment variables
  - Secure setup script (`setup-env.sh`) for configuration
  - No hardcoded secrets in repository

- **Error Handling:**
  - Detailed, actionable error messages with troubleshooting steps
  - Better error context and stack traces
  - Proper HTTP status code handling (no retry on 4xx errors)

- **Dependencies:**
  - Added `winston` for logging
  - Added `form-data` for file uploads
  - Added `jest`, `ts-jest`, `@types/jest` for testing

### Fixed
- JQL search now uses the new `/rest/api/3/search/jql` POST endpoint
- Proper fallback to legacy API when needed
- ESM module compatibility issues resolved

## [1.0.1] - 2025-10-20

### Added
- Initial release
- Basic query tools (list_my_tasks, execute_jql, etc.)
- Worklog management
- Comment management
- Multi-editor support (Claude Code, Cursor, VS Code Copilot)

### Features
- JQL query execution
- Task and subtask listing
- Worklog tracking
- Comment management
- Project queries

[2.0.0]: https://github.com/TechTeam-ClaroEmpresas/jira-mcp-server/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/TechTeam-ClaroEmpresas/jira-mcp-server/releases/tag/v1.0.1
