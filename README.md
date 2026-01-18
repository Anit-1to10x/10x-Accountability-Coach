# 10X Accountability Coach

**Your Personal AI-Powered Accountability System by Team 10X**

A self-contained accountability coaching app with AI-powered chat, challenge tracking, and personalized coaching.

## Features

- **AI Chat** - Streaming responses powered by OpenAnalyst API
- **Challenge Tracking** - Create and track 30-day challenges with daily tasks
- **Streak Tracking** - Visual progress with milestones
- **Daily Check-ins** - Mood tracking, wins/blockers, task completion
- **Skills System** - 20+ skills for structured coaching operations
- **Slash Commands** - Quick actions like `/streak`, `/streak-new`

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
cd 10x-Accoutability-Coach
npm install
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

# Gemini AI (Optional - for image generation)
# GEMINI_API_KEY=your-gemini-key-here
```

#### Step 3: Replace the Placeholder
**IMPORTANT:** Replace `sk-oa-v1-YOUR-ACTUAL-API-KEY-HERE` with your real API key from the email.

Your API key looks like: `sk-oa-v1-xxxxxxxxxxxxxxxxxxxxxxxx`

> **Note:** The `.env.local` file is git-ignored and will NOT be pushed to GitHub. Your API key stays private.

### 3. Start the App

```bash
npm start
```

Open **http://localhost:3000** - Your 10X Coach is ready!

The app will:
- Check and install dependencies automatically
- Prompt for API key if not configured
- Start the Next.js UI

## Architecture

```
User (UI) → Next.js API Route → OpenAnalyst API → Streaming Response → UI
```

**Self-contained** - No second terminal, no WebSocket server, no manual setup.

## Project Structure

```
10X-accountability-coach/
├── ui/                     # Next.js frontend
│   ├── app/                # Pages & API routes
│   │   ├── api/chat/stream # Streaming chat endpoint
│   │   ├── (shell)/        # Main app routes
│   │   └── onboarding/     # First-time setup
│   ├── components/         # React components
│   └── lib/                # Utilities & stores
│       └── api/            # API client & context builder
│
├── skills/                 # AI Skills (20+)
├── commands/               # Slash commands
├── data/                   # User data (file-based)
│   ├── profiles/           # User profiles
│   ├── challenges/         # Challenge configs
│   ├── todos/              # Task lists
│   └── prompts/            # Dynamic prompts
│
├── scripts/
│   ├── start-all.js        # Main startup script
│   └── setup.js            # Interactive setup
│
└── lib/                    # Shared utilities
```

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/app` | Main chat interface |
| `/onboarding` | First-time setup |
| `/schedule` | Calendar view |
| `/streak` | Challenge tracking |
| `/todos` | Task list |
| `/skills` | Skills management |
| `/settings` | User preferences |

## Skills & Commands

### Slash Commands
- `/streak` - Check in to challenge
- `/streak-new` - Create new challenge
- `/streak-list` - List all challenges
- `/streak-stats` - View statistics
- `/streak-switch` - Switch active challenge
- `/streak-insights` - Cross-challenge insights

### Skill Matching
The AI automatically matches user messages to relevant skills and provides structured responses.

## API Configuration

| Variable | Description |
|----------|-------------|
| `OPENANALYST_API_URL` | API base URL |
| `OPENANALYST_API_KEY` | Your API key |
| `OPENANALYST_MODEL` | Model to use |

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm start

# Or run UI only
cd ui && npm run dev

# Run setup wizard
npm run setup
```

## Technology Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Zustand
- **Backend:** Node.js, Next.js API Routes
- **AI:** OpenAnalyst API (Anthropic Messages API compatible)
- **Storage:** File system (Markdown + JSON)

## Troubleshooting

### "API Disconnected" in Settings
If the API shows as disconnected:
1. **Check your API key** - Open `ui/.env.local` and verify your key is correct
2. **No placeholder values** - Make sure you replaced `sk-oa-v1-YOUR-ACTUAL-API-KEY-HERE` with your real key
3. **No extra spaces** - Ensure there are no spaces before/after the key
4. **Restart the server** - Stop (`Ctrl+C`) and restart (`npm run dev`)

### Port Already in Use
```bash
# Kill processes on common ports
npx kill-port 3000 3001 3002

# Then restart
cd ui && npm run dev
```

### Verify API Connection
1. Open the app in browser
2. Go to **Settings** (gear icon)
3. Check **API Status** section
4. Green checkmark = Connected
5. Red X = Check your `.env.local` file

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
