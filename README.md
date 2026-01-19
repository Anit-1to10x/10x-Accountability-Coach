# 10X Accountability Coach

**Your Personal AI-Powered Accountability System by Team 10X**

A comprehensive accountability coaching platform with AI-powered chat, challenge tracking, and personalized coaching. Built with Next.js 14, TypeScript, and the OpenAnalyst API.

## Features

- **AI Chat** - Streaming responses powered by OpenAnalyst API with transparent status updates
- **Challenge Tracking** - Create and track 30-day challenges with daily tasks
- **Streak Tracking** - Visual progress with milestones and achievements
- **Daily Check-ins** - Mood tracking, wins/blockers, task completion
- **Skills System** - 20+ skills for structured coaching operations
- **Slash Commands** - Quick actions like `/streak`, `/streak-new`
- **MCP Integration** - Model Context Protocol support for extensibility
- **Sandbox Execution** - Safe code execution environment for AI responses
- **Agent System** - Multiple AI agents with configurable capabilities
- **Welcome Dialogs** - First-time user onboarding and daily summary for returning users
- **Parallel API Loading** - Optimized performance with concurrent data fetching

## Recent Updates

### Welcome Dialog System
- **First-Time Welcome Dialog** - Multi-step onboarding for new users with system guide, feature overview, and links to settings. Appears only once per user.
- **Daily Summary Dialog** - For returning users, shows streak cards, today's tasks, pending items, quick check-in button, and daily motivation. Appears on first visit each day.

### Performance Optimizations
- **Parallel Context Loading** - API calls for profile, challenges, todos, skills, and MCP tools now run concurrently instead of sequentially
- **MCP Data Fetcher with Streaming** - Agents can fetch MCP data in sandbox with streamed results
- **Optimized Image Loading** - Lazy loading with IntersectionObserver for better performance
- **File Tree Enhancements** - Search functionality, React memoization, and smooth animations

### Navigation Improvements
- **Browser History Sync** - Back/forward buttons now work correctly with pathname-based navigation
- **Shared Chat Capabilities** - Unified chat and individual agents share the same feature set

## Quick Start

### Option A: Using Claude Code (Easiest)

If you have [Claude Code](https://claude.ai/claude-code) installed:

1. Open this project folder in Claude Code
2. Say: **"start my app"**
3. Provide your API key when asked (get one at https://10x.events/api-key)
4. Claude Code will automatically install dependencies, configure everything, and start the app!

> Claude Code handles everything automatically - dependencies, environment setup, and starting the server.

### Option B: Manual Setup

#### 1. Clone & Install

```bash
git clone https://github.com/Anit-1to10x/10x-Accountabilty-Coach.git
cd 10x-Accountability-Coach
npm install
cd ui && npm install
```

### 2. Configure API Key (Required)

#### Step 1: Get Your API Key
1. Visit **https://10x.events/api-key**
2. Enter your email address
3. Check your inbox for the API key email

#### Step 2: Create Environment File
Create `ui/.env.local` file:
```env
# OpenAnalyst AI API (Required)
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=sk-oa-v1-YOUR-ACTUAL-API-KEY-HERE
OPENANALYST_MODEL=openanalyst-beta
```

## OpenAnalyst API Key Structure

The 10X Accountability Coach uses the OpenAnalyst API for AI-powered features. Here's the complete API key configuration:

### Environment Variables

| Variable | Required | Description | Example Value |
|----------|----------|-------------|---------------|
| `OPENANALYST_API_URL` | Yes | Base URL for API requests | `https://api.openanalyst.com/api` |
| `OPENANALYST_API_KEY` | Yes | Your personal API key | `sk-oa-v1-xxxxxxxxxxxxxxxx` |
| `OPENANALYST_MODEL` | Yes | AI model to use | `openanalyst-beta` |
| `GEMINI_API_KEY` | No | Optional for image generation | `AIza...` |

### API Key Format
```
sk-oa-v1-xxxxxxxxxxxxxxxxxxxxxxxx
└──┬───┘ └────────┬───────────────┘
   │              │
   │              └── Unique key identifier
   └── Version prefix (v1)
```

### File Location
```
10x-Accountability-Coach/
├── ui/
│   └── .env.local    ← Your API keys go HERE (git-ignored)
└── .env.example      ← Template file (safe to commit)
```

### Complete Environment File Example
```env
# ===========================================
# OpenAnalyst API Configuration (Required)
# ===========================================
# Get your API key at: https://10x.events/api-key

OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=sk-oa-v1-YOUR-ACTUAL-API-KEY-HERE
OPENANALYST_MODEL=openanalyst-beta

# ===========================================
# Optional Integrations
# ===========================================

# Gemini AI (for image generation features)
# GEMINI_API_KEY=your-gemini-key-here

# Supabase (for cloud database - optional)
# SUPABASE_URL=your-supabase-url
# SUPABASE_KEY=your-supabase-key
```

### 3. Start the App

```bash
npm start
```

Open **http://localhost:3000** - Your 10X Coach is ready!

- Landing page: http://localhost:3000/landing
- Main app: http://localhost:3000/app

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           10X Accountability Coach                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌────────────┐ │
│  │  User    │───▶│  Next.js UI  │───▶│  API Routes   │───▶│ OpenAnalyst│ │
│  │  (Chat)  │◀───│  (React)     │◀───│  (Streaming)  │◀───│ API        │ │
│  └──────────┘    └──────────────┘    └───────────────┘    └────────────┘ │
│                         │                    │                          │
│                         ▼                    ▼                          │
│                  ┌──────────────┐    ┌───────────────┐                  │
│                  │   Zustand    │    │   Sandbox     │                  │
│                  │   Store      │    │   Executor    │                  │
│                  └──────────────┘    └───────────────┘                  │
│                                              │                          │
│                                              ▼                          │
│                                      ┌───────────────┐                  │
│                                      │  MCP Manager  │                  │
│                                      │  (Tools)      │                  │
│                                      └───────────────┘                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Chat Stream API (`ui/app/api/chat/stream/route.ts`)
- Server-Sent Events (SSE) streaming
- Skill matching and prompt selection
- MCP tool integration
- Sandbox code execution
- Phase-based status updates (thinking, generating, executing, etc.)

#### 2. Streaming Status (`ui/components/chat/StreamingStatus.tsx`)
- Transparent status display like Claude Code
- Shows: Thinking, Matching Skill, Executing Tool, Generating
- Animated indicators with phase-specific icons

#### 3. MCP Integration (`ui/lib/mcp/`)
- **client.ts**: MCP server connection (stdio, HTTP, SSE)
- **manager.ts**: Tool execution and management
- Supports Supabase, GitHub, Filesystem, and more

#### 4. Sandbox Executor (`ui/lib/sandbox/executor.ts`)
- Isolated code execution environment
- Supports JavaScript, TypeScript, Python, Shell
- Security blocklist for dangerous commands
- Output truncation and timeout handling

#### 5. Agent System (`ui/types/agent.ts`, `ui/app/api/agents/`)
- Multiple AI agents with configurable capabilities
- Skills, prompts, personality, and restrictions per agent
- Agent-specific chat interfaces

### State Management

Using Zustand for global state:

```typescript
// Key stores in ui/lib/store.ts
- useChatStore: Messages, typing status, streaming phase
- useAgentStore: Agent list and active agent
- useNavigationStore: Active route/selection
- useTodoStore: Task management
- useChallengeStore: Challenge tracking
- useOnboardingStore: User onboarding flow
```

### Streaming Phases

The chat system uses phase-based status updates:

| Phase | Description |
|-------|-------------|
| `idle` | Ready for input |
| `thinking` | Processing request |
| `matching_skill` | Finding relevant skill |
| `matching_prompt` | Selecting framework |
| `loading_tools` | Loading MCP tools |
| `executing_tool` | Running tool call |
| `executing_code` | Sandbox execution |
| `generating` | Streaming response |
| `complete` | Response finished |

## Project Structure

```
10X-Accountability-Coach/
├── ui/                          # Next.js 14 frontend
│   ├── app/                     # App router pages
│   │   ├── api/                 # API routes
│   │   │   ├── chat/stream/     # SSE streaming endpoint
│   │   │   ├── agents/          # Agent management
│   │   │   ├── challenges/      # Challenge CRUD
│   │   │   ├── config/env/      # Environment management
│   │   │   └── sandbox/execute/ # Code execution
│   │   ├── (shell)/             # Main app layout
│   │   │   ├── app/             # Chat interface
│   │   │   ├── settings/        # User settings
│   │   │   ├── streak/          # Challenge tracking
│   │   │   └── todos/           # Task management
│   │   └── onboarding/          # First-time setup
│   │
│   ├── components/              # React components
│   │   ├── chat/                # Chat UI components
│   │   │   ├── UnifiedChat.tsx  # Main chat interface
│   │   │   ├── StreamingStatus.tsx # Status indicators
│   │   │   ├── ChatMessage.tsx  # Message display
│   │   │   └── WelcomeSummary.tsx # Personalized greeting
│   │   ├── dialogs/             # Dialog components
│   │   │   ├── WelcomeDialogManager.tsx # Dialog controller
│   │   │   ├── FirstTimeWelcomeDialog.tsx # New user onboarding
│   │   │   └── DailySummaryDialog.tsx # Daily streak summary
│   │   ├── settings/            # Settings components
│   │   └── ui/                  # Shared UI components
│   │
│   ├── lib/                     # Utilities
│   │   ├── api/                 # API clients
│   │   │   └── parallel-loader.ts # Parallel context loading
│   │   ├── chat/                # Chat utilities
│   │   │   └── shared-capabilities.ts # Unified chat features
│   │   ├── mcp/                 # MCP integration
│   │   │   ├── client.ts        # MCP client
│   │   │   ├── manager.ts       # Tool management
│   │   │   └── data-fetcher.ts  # MCP data streaming
│   │   ├── sandbox/             # Code execution
│   │   │   └── executor.ts      # Sandbox executor
│   │   └── store.ts             # Zustand stores
│   │
│   ├── types/                   # TypeScript types
│   │   ├── agent.ts             # Agent definitions
│   │   ├── mcp.ts               # MCP types
│   │   └── index.ts             # Shared types
│   │
│   └── public/                  # Static assets
│       └── landing/             # Landing page files
│
├── data/                        # User data (file-based)
│   ├── profiles/                # User profiles
│   ├── challenges/              # Challenge configs
│   └── prompts/                 # Dynamic prompts
│
├── skills/                      # AI Skills (20+)
├── commands/                    # Slash commands
├── docs/                        # Landing page source
│
├── vercel.json                  # Vercel deployment config
├── CLAUDE.md                    # Claude Code instructions
└── README.md                    # This file
```

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Loading screen, redirects to profiles |
| `/landing` | Marketing landing page |
| `/profiles` | User profile selection |
| `/app` | Main chat interface |
| `/onboarding` | First-time setup |
| `/schedule` | Calendar view |
| `/streak` | Challenge tracking |
| `/todos` | Task list |
| `/skills` | Skills management |
| `/settings` | User preferences & API keys |

## Skills & Commands

### Slash Commands
- `/streak` - Check in to challenge
- `/streak-new` - Create new challenge
- `/streak-list` - List all challenges
- `/streak-stats` - View statistics
- `/streak-switch` - Switch active challenge
- `/streak-insights` - Cross-challenge insights

### Skill Matching
The AI automatically matches user messages to relevant skills and provides structured responses with skill-specific behavior.

## API Configuration

| Variable | Description |
|----------|-------------|
| `OPENANALYST_API_URL` | API base URL |
| `OPENANALYST_API_KEY` | Your API key |
| `OPENANALYST_MODEL` | Model to use |

## Deployment

### Vercel Deployment

The project is configured for easy Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `OPENANALYST_API_URL`
   - `OPENANALYST_API_KEY`
   - `OPENANALYST_MODEL`
3. Deploy!

The `vercel.json` configuration handles:
- Next.js build commands
- API function timeouts (60s max)
- Landing page routing
- Security headers
- CORS configuration

### Local Development

```bash
# Install dependencies
npm install && cd ui && npm install

# Start development server
npm start
# or
cd ui && npm run dev

# Build for production
cd ui && npm run build

# Type check
cd ui && npx tsc --noEmit
```

## Technology Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Node.js, Next.js API Routes, Server-Sent Events
- **AI:** OpenAnalyst API (Anthropic Messages API compatible)
- **Storage:** File system (Markdown + JSON)
- **MCP:** Model Context Protocol for tool extensibility

## Troubleshooting

### "API Disconnected" in Settings
If the API shows as disconnected:
1. **Check your API key** - Open `ui/.env.local` and verify your key is correct
2. **No placeholder values** - Make sure you replaced the placeholder with your real key
3. **No extra spaces** - Ensure there are no spaces before/after the key
4. **Restart the server** - Stop (`Ctrl+C`) and restart (`npm run dev`)

### Port Already in Use
```bash
# Kill processes on common ports
npx kill-port 3000 3001 3002

# Then restart
cd ui && npm run dev
```

### Build Errors
```bash
cd ui && rm -rf .next && npm run build
```

### Environment File Location
The environment file must be at: `ui/.env.local` (NOT in the project root)

```
10x-Accountability-Coach/
├── ui/
│   └── .env.local    ← Your API key goes HERE
└── .env.example      ← This is just a template
```

## License

MIT License

---

**Developed by Team 10X** | Powered by OpenAnalyst
