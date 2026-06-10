# FreshBooks MCP by Good Samaritan Software

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-1613%20passing-brightgreen.svg)](#testing)

Manage your FreshBooks in plain English from Claude or ChatGPT. **FreshBooks MCP** is a fully hosted service — no local install, no API keys to manage, one OAuth sign-in to your FreshBooks account. 41 of the 92 tools are read-only by default; write operations surface a confirmation step in your AI client before any data changes.

**[Get started →](https://freshbooks.goodsamsoftware.com)** &nbsp;·&nbsp; **[Documentation](https://freshbooks.goodsamsoftware.com/docs)** &nbsp;·&nbsp; **[Pricing — from $29/mo](https://freshbooks.goodsamsoftware.com/#pricing)**

> Currently available in the **United States**. International waitlist available at the link above.

---

## What you can do

**92 tools** spanning invoices, clients, expenses, time tracking, projects, payments, vendors, bills, and reports — with 41 read-only tools for safe lookups and 51 write tools for full account management.

Example prompts:
- *"Show me all unpaid invoices over $500"*
- *"Create an invoice for Acme Corp for $1,500 due in 30 days"*
- *"What's my profit and loss for this year?"*
- *"Log 2 hours on the Website Redesign project"*
- *"Start a timer for this client meeting"*
- *"Record a $45 office supplies expense"*
- *"List all vendors I've paid this quarter"*

---

## Quick Start — Hosted Service (Recommended)

The fastest path: subscribe, connect FreshBooks, paste your config into your AI client.

### Claude (Desktop, Code, Web)

1. Go to **[freshbooks.goodsamsoftware.com](https://freshbooks.goodsamsoftware.com)**, create an account, and connect your FreshBooks account. Copy your API key from the dashboard.
2. Add to your Claude Desktop config (`claude_desktop_config.json`) or Claude Code project config (`.mcp.json`):

```json
{
  "mcpServers": {
    "freshbooks": {
      "command": "npx",
      "args": ["mcp-remote", "https://freshbooks.goodsamsoftware.com/api/mcp", "--header", "Authorization:Bearer YOUR_API_KEY"]
    }
  }
}
```

### ChatGPT

1. In ChatGPT, go to **Settings → Connectors → Add connector**.
2. Enter the MCP server URL: `https://freshbooks.goodsamsoftware.com/api/mcp`
3. Complete the OAuth flow to connect your FreshBooks account.

### Other MCP Clients (Cursor, Windsurf, Continue, Cline, etc.)

Use the same `mcp-remote` configuration shown above, substituting your client's config location.

---

## Available Tools (92 total)

### Invoices (6 tools)
| Tool | Read-only | Description |
|------|-----------|-------------|
| `invoice_list` | ✓ | List invoices with filters |
| `invoice_single` | ✓ | Get invoice by ID |
| `invoice_share_link` | ✓ | Get shareable payment link |
| `invoice_create` | | Create invoice |
| `invoice_update` | | Update invoice |
| `invoice_delete` | | Delete invoice |

### Clients (5 tools)
| Tool | Read-only | Description |
|------|-----------|-------------|
| `client_list` | ✓ | List clients |
| `client_single` | ✓ | Get client by ID |
| `client_create` | | Create client |
| `client_update` | | Update client |
| `client_delete` | | Delete client |

### Time Tracking (9 tools)
| Tool | Read-only | Description |
|------|-----------|-------------|
| `timeentry_list` | ✓ | List time entries with filters |
| `timeentry_single` | ✓ | Get time entry by ID |
| `timer_current` | ✓ | Get running timer |
| `timeentry_create` | | Create time entry |
| `timeentry_update` | | Update time entry |
| `timeentry_delete` | | Delete time entry |
| `timer_start` | | Start a timer |
| `timer_stop` | | Stop timer and save entry |
| `timer_discard` | | Discard running timer |

### Projects (5 tools)
| Tool | Read-only | Description |
|------|-----------|-------------|
| `project_list` | ✓ | List projects |
| `project_single` | ✓ | Get project by ID |
| `project_create` | | Create project |
| `project_update` | | Update project |
| `project_delete` | | Delete project |

### Expenses (5 tools)
| Tool | Read-only | Description |
|------|-----------|-------------|
| `expense_list` | ✓ | List expenses |
| `expense_single` | ✓ | Get expense by ID |
| `expense_create` | | Create expense |
| `expense_update` | | Update expense |
| `expense_delete` | | Delete expense |

### Payments (5 tools)
| Tool | Read-only | Description |
|------|-----------|-------------|
| `payment_list` | ✓ | List invoice payments |
| `payment_single` | ✓ | Get payment by ID |
| `payment_create` | | Record payment |
| `payment_update` | | Update payment |
| `payment_delete` | | Delete payment |

### Bills (10 tools)
| Tool | Read-only | Description |
|------|-----------|-------------|
| `bill_list` | ✓ | List bills |
| `bill_single` | ✓ | Get bill by ID |
| `billpayment_list` | ✓ | List bill payments |
| `billpayment_single` | ✓ | Get bill payment by ID |
| `bill_create` | | Create bill |
| `bill_archive` | | Archive bill |
| `bill_delete` | | Delete bill |
| `billpayment_create` | | Record bill payment |
| `billpayment_update` | | Update bill payment |
| `billpayment_delete` | | Delete bill payment |

### Vendors (5 tools)
| Tool | Read-only | Description |
|------|-----------|-------------|
| `billvendor_list` | ✓ | List vendors |
| `billvendor_single` | ✓ | Get vendor by ID |
| `billvendor_create` | | Create vendor |
| `billvendor_update` | | Update vendor |
| `billvendor_delete` | | Delete vendor |

### Reports (3 tools — all read-only)
| Tool | Description |
|------|-------------|
| `report_profit_loss` | Profit & loss report |
| `report_payments_collected` | Payments collected report |
| `report_tax_summary` | Tax summary report |

### Additional Tools

| Category | Count | Read-only | Description |
|----------|-------|-----------|-------------|
| **Credit Notes** | 5 | 2 | Create and manage credit notes |
| **Expense Categories** | 2 | 2 | Browse expense categories |
| **Items** | 4 | 2 | Product/service catalog |
| **Journal Entries** | 2 | 1 | Manual accounting entries |
| **Other Income** | 5 | 2 | Non-invoice income tracking |
| **Payment Options** | 3 | 2 | Payment gateway settings |
| **Services** | 5 | 3 | Billable service types incl. rate get/set |
| **Tasks** | 5 | 2 | Project task management |
| **User** | 1 | 1 | Current user info |
| **Callbacks** | 7 | 2 | Webhook management |

---

## Self-Hosted Setup

You can also run the MCP server locally with your own FreshBooks OAuth application. This is optional — most users should use the hosted service above.

> **Note:** FreshBooks requires HTTPS for all OAuth callback URLs, including localhost. See [Local HTTPS Setup](#advanced-local-https-setup) below.

### 1. Get FreshBooks Credentials

1. Go to [FreshBooks Developer Portal](https://my.freshbooks.com/#/developer)
2. Create a new application
3. Set redirect URI to: `https://freshbooks.goodsamsoftware.com/callback`
4. Note your Client ID and Client Secret

### 2. Install and Configure

```bash
npm install @goodsamsoftware/freshbooks-mcp
```

Add to your Claude Desktop config:

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

Ask Claude: *"Connect me to FreshBooks"*

Claude will guide you through OAuth. After authorizing, copy the code from the [hosted callback page](https://freshbooks.goodsamsoftware.com) and paste it back to Claude.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FRESHBOOKS_CLIENT_ID` | Yes | OAuth client ID |
| `FRESHBOOKS_CLIENT_SECRET` | Yes | OAuth client secret |
| `FRESHBOOKS_REDIRECT_URI` | Yes | OAuth redirect URI |
| `FRESHBOOKS_TOKEN_PATH` | No | Path for token storage |
| `LOG_LEVEL` | No | Logging level (debug, info, warn, error) |

### Advanced: Local HTTPS Setup

For a local callback URL, set up trusted certificates with [mkcert](https://github.com/FiloSottile/mkcert):

**Windows:** `winget install FiloSottile.mkcert`
**macOS:** `brew install mkcert`
**Linux:** See [mkcert installation](https://github.com/FiloSottile/mkcert#installation)

```bash
mkcert -install
mkdir certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1
```

Then set your redirect URI to `https://localhost:3000/callback` in FreshBooks.

---

## Development

```bash
npm install          # Install dependencies
npm run dev          # Run in development mode
npm test             # Run tests
npm run test:coverage  # Run with coverage report
npm run typecheck    # Type check
npm run build        # Build for production
```

## Testing

- **1,613 tests** across 93 test files
- **100% code coverage** requirement
- Mock factories for all FreshBooks entities

## Architecture

```
src/
├── server.ts             # MCP server entry point
├── auth/                 # OAuth2 authentication
├── client/               # FreshBooks SDK wrapper
├── errors/               # Error normalization
├── tools/                # MCP tool implementations (22 categories)
│   ├── time-entry/       # Time tracking
│   ├── timer/            # Timer management
│   ├── invoice/          # Invoicing
│   ├── client/           # Client management
│   ├── project/          # Projects
│   ├── expense/          # Expenses
│   ├── bill/             # Bills
│   └── ...               # 15 more categories
└── config/               # Configuration
```

## Documentation

- [Full Documentation](https://freshbooks.goodsamsoftware.com/docs)
- [API Reference](docs/api/) - Complete tool documentation
- [Authentication Setup](docs/AUTH_SETUP.md) - OAuth configuration
- [Examples](docs/examples/) - Workflow examples

## License

MIT License — see [LICENSE](LICENSE) for details.

## Credits

- [FreshBooks Node.js SDK](https://github.com/freshbooks/freshbooks-nodejs-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
