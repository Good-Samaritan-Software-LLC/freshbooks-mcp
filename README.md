# FreshBooks MCP Server

A Model Context Protocol (MCP) server providing complete FreshBooks integration for Claude and other MCP-compatible AI assistants.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-1571%20passing-brightgreen.svg)](#testing)

## Features

- **Complete SDK Parity** - 87 tools covering all major FreshBooks functionality
- **22 Entity Categories** - Full coverage of accounting, invoicing, time tracking, and more
- **Time Tracking** - Log time, manage timers, track billable hours
- **Invoicing & Billing** - Create invoices, manage bills, handle payments
- **Expense Management** - Track expenses, categorize spending, manage vendors
- **Client & Project Management** - Full CRM and project capabilities
- **Financial Reports** - Profit/loss, tax summaries, and more
- **OAuth2 Authentication** - Secure token-based authentication with auto-refresh

## Installation

```bash
npm install @goodsamsoftware/freshbooks-mcp
```

## Quick Start

The fastest way to get started is with our **hosted service** — no OAuth setup required.

### 1. Sign Up

Go to [freshbooks.goodsamsoftware.com](https://freshbooks.goodsamsoftware.com) and create an account (**14-day free trial**). Once you're in, connect your FreshBooks account from the dashboard.

### 2. Copy Your Configuration

From your dashboard, copy the configuration snippet provided. It works with both **Claude Desktop** and **Claude Code**.

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "freshbooks": {
      "command": "npx",
      "args": ["mcp-remote", "https://freshbooks.goodsamsoftware.com/api/mcp", "--header", "Authorization:Bearer YOUR_TOKEN"]
    }
  }
}
```

**Claude Code** (`.mcp.json` in your project):
```json
{
  "mcpServers": {
    "freshbooks": {
      "command": "npx",
      "args": ["mcp-remote", "https://freshbooks.goodsamsoftware.com/api/mcp", "--header", "Authorization:Bearer YOUR_TOKEN"]
    }
  }
}
```

### 3. Start Using

Example prompts:
- "Log 2 hours on the Website Redesign project"
- "Show me my time entries for this week"
- "Start a timer for client meeting"
- "Create an invoice for Acme Corp for $1,500"
- "What's my profit/loss this month?"

---

## Self-Hosted Setup

You can also run the MCP server locally with your own FreshBooks API application.

> **Note:** FreshBooks requires HTTPS for all OAuth callback URLs, including localhost. See [Local HTTPS Setup](#advanced-local-https-setup) below for instructions.

### 1. Get FreshBooks Credentials

1. Go to [FreshBooks Developer Portal](https://my.freshbooks.com/#/developer)
2. Create a new application
3. Set redirect URI to: `https://freshbooks.goodsamsoftware.com/callback`
4. Note your Client ID and Client Secret

### 2. Configure Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "freshbooks": {
      "command": "npx",
      "args": ["@goodsamsoftware/freshbooks-mcp"],
      "env": {
        "FRESHBOOKS_CLIENT_ID": "your-client-id",
        "FRESHBOOKS_CLIENT_SECRET": "your-client-secret",
        "FRESHBOOKS_REDIRECT_URI": "https://freshbooks.goodsamsoftware.com/callback"
      }
    }
  }
}
```

### 3. Authenticate

Ask Claude:
> "Connect me to FreshBooks"

Claude will guide you through OAuth authentication. After authorizing in FreshBooks, you'll see the authorization code on our [hosted callback page](https://freshbooks.goodsamsoftware.com) - just copy it and paste it back to Claude.

### 4. Start Using

Example prompts:
- "Log 2 hours on the Website Redesign project"
- "Show me my time entries for this week"
- "Start a timer for client meeting"
- "Create an invoice for Acme Corp for $1,500"
- "What's my profit/loss this month?"

## Available Tools (87 total)

### Authentication (5 tools)
| Tool | Description |
|------|-------------|
| `auth_status` | Check authentication status |
| `auth_get_url` | Get OAuth authorization URL |
| `auth_exchange_code` | Exchange auth code for tokens |
| `auth_refresh` | Refresh access token |
| `auth_revoke` | Revoke authentication |

### Time Tracking (5 tools)
| Tool | Description |
|------|-------------|
| `timeentry_list` | List time entries with filters |
| `timeentry_single` | Get time entry by ID |
| `timeentry_create` | Create time entry |
| `timeentry_update` | Update time entry |
| `timeentry_delete` | Delete time entry |

### Timer Management (4 tools)
| Tool | Description |
|------|-------------|
| `timer_start` | Start a timer |
| `timer_stop` | Stop timer and log time |
| `timer_current` | Get running timer(s) |
| `timer_discard` | Delete timer without logging |

### Invoicing (5 tools)
| Tool | Description |
|------|-------------|
| `invoice_list` | List invoices |
| `invoice_single` | Get invoice by ID |
| `invoice_create` | Create invoice |
| `invoice_update` | Update invoice |
| `invoice_delete` | Delete invoice |

### Clients (5 tools)
| Tool | Description |
|------|-------------|
| `client_list` | List clients |
| `client_single` | Get client by ID |
| `client_create` | Create client |
| `client_update` | Update client |
| `client_delete` | Delete client |

### Projects (5 tools)
| Tool | Description |
|------|-------------|
| `project_list` | List projects |
| `project_single` | Get project by ID |
| `project_create` | Create project |
| `project_update` | Update project |
| `project_delete` | Delete project |

### Expenses (5 tools)
| Tool | Description |
|------|-------------|
| `expense_list` | List expenses |
| `expense_single` | Get expense by ID |
| `expense_create` | Create expense |
| `expense_update` | Update expense |
| `expense_delete` | Delete expense |

### Bills & Payments (15 tools)
| Tool | Description |
|------|-------------|
| `bill_list` | List bills |
| `bill_single` | Get bill by ID |
| `bill_create` | Create bill |
| `bill_update` | Update bill |
| `bill_delete` | Delete bill |
| `billpayment_list` | List bill payments |
| `billpayment_single` | Get bill payment |
| `billpayment_create` | Create bill payment |
| `billpayment_update` | Update bill payment |
| `billpayment_delete` | Delete bill payment |
| `billvendor_list` | List vendors |
| `billvendor_single` | Get vendor by ID |
| `billvendor_create` | Create vendor |
| `billvendor_update` | Update vendor |
| `billvendor_delete` | Delete vendor |

### Additional Tools

| Category | Tools | Description |
|----------|-------|-------------|
| **Credit Notes** | 5 | Create, manage credit notes |
| **Expense Categories** | 3 | Manage expense categories |
| **Items** | 5 | Product/service catalog |
| **Journal Entries** | 5 | Manual accounting entries |
| **Journal Entry Accounts** | 3 | Chart of accounts |
| **Other Income** | 5 | Non-invoice income tracking |
| **Payments** | 5 | Invoice payment tracking |
| **Payment Options** | 2 | Payment gateway settings |
| **Reports** | 3 | Financial reports |
| **Services** | 5 | Billable service types |
| **Tasks** | 5 | Project task management |
| **User** | 1 | Current user info |
| **Callbacks** | 5 | Webhook management |

*See complete tool documentation in [docs/api/](docs/api/)*

## Configuration (Self-Hosted)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FRESHBOOKS_CLIENT_ID` | Yes | OAuth client ID |
| `FRESHBOOKS_CLIENT_SECRET` | Yes | OAuth client secret |
| `FRESHBOOKS_REDIRECT_URI` | Yes | OAuth redirect URI |
| `FRESHBOOKS_TOKEN_PATH` | No | Path for token storage |
| `LOG_LEVEL` | No | Logging level (debug, info, warn, error) |

### Advanced: Local HTTPS Setup

If you prefer to use a local callback instead of our hosted callback page, you can set up local HTTPS certificates with [mkcert](https://github.com/FiloSottile/mkcert):

**Windows (winget):**
```bash
winget install FiloSottile.mkcert
mkcert -install
mkdir certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1
```

**macOS (Homebrew):**
```bash
brew install mkcert
mkcert -install
mkdir certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1
```

**Linux:**
```bash
# Install mkcert (see https://github.com/FiloSottile/mkcert#installation)
mkcert -install
mkdir certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1
```

Then set your redirect URI to `https://localhost:3000/callback` in FreshBooks.

The certificates will be valid for 3 years and trusted by your system.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck

# Build for production
npm run build
```

## Testing

The project has comprehensive test coverage:

- **1,571 tests** across 93 test files
- **100% code coverage** requirement
- Mock factories for all FreshBooks entities
- Error scenario coverage

```bash
npm test                 # Run all tests
npm run test:coverage    # Run with coverage report
```

## Architecture

```
src/
├── server.ts             # MCP server entry point
├── auth/                 # OAuth2 authentication
├── client/               # FreshBooks SDK wrapper
├── errors/               # Error normalization
├── tools/                # MCP tool implementations (22 categories)
│   ├── auth/             # Authentication tools
│   ├── time-entry/       # Time tracking
│   ├── timer/            # Timer management
│   ├── invoice/          # Invoicing
│   ├── client/           # Client management
│   ├── project/          # Projects
│   ├── expense/          # Expenses
│   ├── bill/             # Bills
│   └── ...               # 14 more categories
└── config/               # Configuration
```

## Documentation

- [API Reference](docs/api/) - Complete tool documentation
- [Authentication Setup](docs/AUTH_SETUP.md) - OAuth configuration
- [Claude Guide](docs/claude/) - Claude-optimized usage examples
- [Examples](docs/examples/) - Workflow examples

## Error Handling

All errors are normalized to MCP format with helpful context:

```json
{
  "code": -32005,
  "message": "User-friendly message",
  "data": {
    "freshbooksError": { "code": "...", "message": "..." },
    "recoverable": true,
    "suggestion": "What to do next"
  }
}
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- [FreshBooks Node.js SDK](https://github.com/freshbooks/freshbooks-nodejs-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
