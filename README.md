# 10X Accountability Coach

**Your Personal AI-Powered Accountability System by Team 10X**

A dual-system accountability platform: **Claude Code CLI** as the brain + **Next.js UI** as the display. Create agents, challenges, and plans from the terminal — interact with them in the browser.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    10X Accountability Coach                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                   │
│  │  CLI Terminal │ writes  │  Local Files  │  reads           │
│  │  (Claude Code)│───────▶│  (./data/)    │◀────────┐        │
│  │  37 Commands  │         │  JSON + MD    │         │        │
│  └──────────────┘         └──────────────┘         │        │
│                                                     │        │
│  ┌──────────────┐         ┌──────────────┐         │        │
│  │  OpenAnalyst  │◀───────│  UI (Next.js) │─────────┘        │
│  │  API          │───────▶│  localhost:3000│                   │
│  │  (Dual AI)    │         │  Auto-refresh │                   │
│  └──────────────┘         └──────────────┘                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

- **CLI** = Create agents, challenges, todos, plans, check-ins via slash commands
- **UI** = View, interact, chat, complete tasks, reschedule in the browser
- **OpenAnalyst API** = Powers both CLI and UI with context-aware AI
- **Local Files** = All data in `./data/` — no cloud required

## Features

- **37 Slash Commands** — Full CLI coverage for every feature
- **Dynamic Agent System** — Create custom AI agents (fitness coach, nutritionist, etc.) with personality, skills, and references
- **Context-Aware Chat** — Conversation history preserved across messages (last 10 messages, ~3000 token budget)
- **Chat Persistence** — Messages saved to disk, survive page refresh
- **Challenge Tracking** — 30-day challenges with streaks, daily tasks, and insights
- **20+ AI Skills** — Structured coaching operations (motivation, scheduling, check-ins, etc.)
- **Small-Model Optimized** — Commands use tagged format (~500 tokens each) for efficient parsing
- **MCP Integration** — Model Context Protocol for extensibility
- **Multi-Agent Chat** — Select agents in sidebar, chat uses their personality
- **Vision Boards, Plans, Contracts** — Full accountability toolkit

## Quick Start

### Option A: Using Claude Code (Recommended)

1. Open this project folder in Claude Code
2. Say: **"start my app"**
3. Provide your API key when asked (get one at **https://10x.in/dashboard**)
4. Claude Code handles everything — dependencies, config, and startup!

> The app MUST run on **port 3000**. If the port is busy, setup will kill existing processes first.

### Option B: Using OpenCode (Full Compatibility)

This project is a fully compatible [OpenCode](https://opencode.ai) skills plugin:

1. Clone this repo
2. Run `opencode` in the project directory
3. OpenCode auto-loads: `opencode.json`, `.opencode/agents/`, `.opencode/commands/`, `.opencode/skills/`
4. Say: **"start my app"** — the setup agent handles everything
5. Use any model (Victoire, Kimi 2.5, Claude, etc.)

### Option C: Any AI CLI / Free Models

Commands work with any AI CLI that reads `commands/` directory:

1. Clone this repo
2. Install: `npm install && cd ui && npm install`
3. Create `ui/.env.local` (see Environment Setup below)
4. Start: `npx kill-port 3000 && cd ui && npm run dev`
5. Open **http://localhost:3000**

### Option D: Manual Setup

#### 1. Clone & Install

```bash
git clone https://github.com/Anit-1to10x/10x-Accountabilty-Coach.git
cd 10x-Accountability-Coach
npm install
cd ui && npm install
```

#### 2. Environment Setup

Create `ui/.env.local`:

```env
# Required: OpenAnalyst AI API
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=sk-oa-v1-YOUR-KEY-HERE
OPENANALYST_MODEL=openanalyst-beta

# Optional: Data source (local or supabase)
DATA_SOURCE=local

# Optional: Gemini for image generation
# GEMINI_API_KEY=your-gemini-key

# Optional: Supabase for cloud sync
# SUPABASE_URL=your-url
# SUPABASE_ANON_KEY=your-key
```

Get your API key at: **https://10x.in/dashboard** (format: `sk-oa-v1-xxx`)

#### 3. Start

```bash
npx kill-port 3000
cd ui && npm run dev
```

Open **http://localhost:3000**

## All 37 Slash Commands

### Streaks & Challenges
| Command | Description |
|---------|-------------|
| `/streak` | Check in to active challenge |
| `/streak-new` | Create a new challenge |
| `/streak-list` | List all challenges |
| `/streak-stats` | View challenge statistics |
| `/streak-switch` | Switch active challenge |
| `/streak-insights` | Cross-challenge insights |
| `/challenge` | Browse challenge templates |

### Agents
| Command | Description |
|---------|-------------|
| `/agent` | View all agents |
| `/agent-new` | Create a custom AI agent |
| `/agent-edit` | Edit agent personality, skills, prompts |
| `/agent-skills` | Manage agent's assigned skills |
| `/agent-delete` | Delete an agent |
| `/agent-chat` | Chat with a specific agent |
| `/agent-ref` | Add reference files to agent |

### Todos & Schedule
| Command | Description |
|---------|-------------|
| `/todo` | View all todos |
| `/todo-add` | Add a new todo |
| `/todo-list` | List todos with filters |
| `/todo-complete` | Mark todo as done |
| `/schedule` | View your schedule |
| `/reschedule` | Reschedule a task |

### Check-ins & Motivation
| Command | Description |
|---------|-------------|
| `/checkin` | Daily accountability check-in |
| `/checkin-history` | View check-in history |
| `/motivate` | Get a motivation boost |

### Planning & Vision
| Command | Description |
|---------|-------------|
| `/plan` | View active plan |
| `/plan-new` | Create a new plan |
| `/visionboard` | View vision board |
| `/visionboard-new` | Create a vision board |

### Accountability
| Command | Description |
|---------|-------------|
| `/contract` | Create/view accountability contract |
| `/punishment` | Manage consequences |

### Skills & Tools
| Command | Description |
|---------|-------------|
| `/skill-list` | List all 20+ AI skills |
| `/skill-new` | Create a custom skill |
| `/prompt` | Manage prompt templates |

### Workspace & System
| Command | Description |
|---------|-------------|
| `/workspace` | View workspace overview |
| `/asset` | Manage assets |
| `/history` | View activity history |
| `/onboard` | Run onboarding setup |
| `/help` | Show all commands |

## Agent System

Create custom AI agents from the terminal or the UI:

```bash
# From Claude Code CLI
/agent-new "Fitness Coach"
# → Creates data/agents/fitness-coach/ with full workspace
# → Auto-assigns fitness skills (workout, nutrition)
# → Sets personality: energetic, motivating
# → Shows in UI sidebar instantly

/agent-ref fitness-coach --add
# → Add workout plans, meal templates as reference files
# → Agent uses these for context-aware responses
```

**Agent personality presets:** Drill Sergeant, Best Friend, Mentor, Hype Man, Professor, Custom

**Agent types auto-detected:** fitness, finance, learning, career, creative, general

### How Agents Work
1. Create via `/agent-new` (CLI) or "+" button (UI)
2. Data stored in `data/agents.json` + `data/agent-capabilities.json`
3. Workspace at `data/agents/{id}/` (files, notes, chats, generated content)
4. Select in UI sidebar → chat uses agent's personality + skills
5. Reference files provide context-aware responses

## Project Structure

```
10X-Accountability-Coach/
├── .claude/                     # Claude Code configuration
│   ├── commands/                # Slash commands (for Claude Code CLI)
│   └── instructions.md          # Claude Code startup behavior
│
├── .opencode/                   # OpenCode configuration
│   ├── agents/                  # Agent definitions (coach.md, setup.md)
│   ├── commands/                # Slash commands (for OpenCode CLI)
│   └── skills/                  # Skills with OpenCode frontmatter
│
├── opencode.json                # OpenCode config (loads CLAUDE.md)
│
├── commands/                    # Slash commands (for any CLI / free models)
│   ├── _format.md              # Tag format reference
│   ├── streak.md ... (6)       # Streak commands
│   ├── agent.md ... (7)        # Agent commands
│   ├── todo.md ... (4)         # Todo commands
│   ├── checkin.md ... (2)      # Check-in commands
│   ├── plan.md ... (2)         # Plan commands
│   ├── visionboard.md ... (2)  # Vision commands
│   └── help.md, etc.           # System commands
│
├── skills/                      # 20+ AI skill definitions
│   ├── streak/                  # Challenge tracking
│   ├── daily-checkin/           # Check-in flow
│   ├── motivation/              # Motivation engine
│   ├── workout-program-designer/# Fitness programs
│   ├── nutritional-specialist/  # Nutrition guidance
│   └── ...                      # 15+ more skills
│
├── data/                        # All user data (local storage)
│   ├── agents.json              # Agent registry
│   ├── agent-capabilities.json  # Agent skills/personality
│   ├── agents/                  # Agent workspaces
│   ├── config.json              # App configuration
│   ├── challenges/              # Challenge templates (30-day content)
│   ├── profiles/                # User profiles (runtime)
│   ├── todos/                   # User todos (runtime)
│   ├── checkins/                # Check-in records (runtime)
│   ├── chats/                   # Chat history (runtime)
│   └── schemas/                 # Supabase SQL schemas
│
├── ui/                          # Next.js 14 frontend
│   ├── .env.local              # API keys (git-ignored)
│   ├── app/                    # Pages & API routes
│   │   ├── api/chat/stream/    # SSE streaming with conversation history
│   │   ├── api/agents/         # Agent CRUD
│   │   ├── (shell)/            # 17+ app pages
│   │   └── ...
│   ├── components/             # React components
│   ├── lib/                    # Stores, utilities, data adapters
│   └── package.json
│
├── CLAUDE.md                    # Setup instructions (for AI assistants)
├── README.md                    # This file
└── package.json                 # Root dependencies
```

## Command Format (Small-Model Optimized)

Commands use structured XML-like tags for efficient parsing (~500 tokens each instead of ~2000):

```markdown
---
description: Short description for command matching
---
<cmd name="command-name">What it does</cmd>
<ref>skills/relevant-skill/SKILL.md</ref>

<steps>
1. Step one
2. Step two
</steps>

<data path="data/path/{id}.json">
{field1, field2, field3}
</data>

<output>What user sees after execution</output>
```

This format works with Claude Code, OpenCode, and free models (Victoire, Kimi 2.5, etc.).

## CLI Compatibility

| CLI | Config | Commands | Skills | Agents |
|-----|--------|----------|--------|--------|
| **Claude Code** | `CLAUDE.md` | `.claude/commands/` | `skills/` | via commands |
| **OpenCode** | `opencode.json` | `.opencode/commands/` | `.opencode/skills/` | `.opencode/agents/` |
| **Any CLI** | `CLAUDE.md` | `commands/` | `skills/` | via commands |

All three read the same data (`./data/`) and use the same UI (`localhost:3000`).

## Context-Aware Chat

The chat system maintains conversation memory:

- **History**: Last 10 messages sent to API with each request (~3000 token budget)
- **Persistence**: Messages saved to `data/chats/{date}/{agentId}.md`
- **Profile Context**: User profile, challenges, todos, streaks injected into system prompt
- **Agent Personality**: Selected agent's tone, style, skills shape every response
- **Skill Matching**: Messages auto-matched to relevant skills for structured behavior

## API Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENANALYST_API_URL` | Yes | `https://api.openanalyst.com/api` |
| `OPENANALYST_API_KEY` | Yes | Your key (starts with `sk-oa-v1-`) |
| `OPENANALYST_MODEL` | Yes | `openanalyst-beta` |
| `DATA_SOURCE` | No | `local` (default) or `supabase` |
| `GEMINI_API_KEY` | No | For image generation |
| `SUPABASE_URL` | No | For cloud sync |
| `SUPABASE_ANON_KEY` | No | For cloud sync |

## Deployment

### Vercel
1. Connect GitHub repo to Vercel
2. Add env vars in Vercel dashboard
3. Deploy

### Local Development
```bash
npm install && cd ui && npm install
npx kill-port 3000
cd ui && npm run dev
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "API Disconnected" | Check `ui/.env.local` has valid key, restart server |
| Port 3000 in use | `npx kill-port 3000 3001 3002` then restart |
| Dependencies broken | `npx rimraf node_modules ui/node_modules` then reinstall |
| Build errors | `cd ui && npx rimraf .next && npm run build` |
| Chat has no memory | Ensure `history` is being sent (check browser network tab) |

## Technology Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Node.js, Next.js API Routes, Server-Sent Events
- **AI:** OpenAnalyst API (Anthropic Messages API compatible)
- **Storage:** File system (Markdown + JSON), optional Supabase
- **CLI:** Claude Code, OpenCode (full plugin support), any AI CLI
- **MCP:** Model Context Protocol for tool extensibility

## License

+10x Team Proprietary - For use with [10x.in](https://10x.in) subscription.

---

**Developed by Team 10X** | Powered by OpenAnalyst
