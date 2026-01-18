# 10X Accountability Coach - Claude Code Instructions

## IMPORTANT: Auto-Setup Instructions for Claude Code

When a user says **"start my app"**, **"run the app"**, **"set up the project"**, or similar commands, Claude Code (YOU) must automatically perform the following steps:

### Step 1: Check and Install Dependencies

```bash
# Install root dependencies
npm install

# Install UI dependencies
cd ui && npm install && cd ..
```

### Step 2: Check for API Key Configuration

Check if `ui/.env.local` exists and has a valid API key:

```bash
cat ui/.env.local 2>/dev/null || echo "NOT_FOUND"
```

**If the file doesn't exist OR contains placeholder `sk-oa-v1-your-key-here`:**

1. Ask the user: "Do you have an OpenAnalyst API key? If not, get one at https://10x.events/api-key"
2. Once user provides the key, create `ui/.env.local`:

```env
# OpenAnalyst AI API (Required)
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=<USER'S ACTUAL API KEY>
OPENANALYST_MODEL=openanalyst-beta
```

### Step 3: Kill Any Existing Processes on Port 3000

```bash
npx kill-port 3000 2>/dev/null || true
```

### Step 4: Start the Application

```bash
cd ui && npm run dev
```

### Step 5: Confirm to User

Tell the user: "Your 10X Accountability Coach is running at http://localhost:3000"

---

## One-Command Setup Flow

When user says "start my app", execute this flow:

```
1. npm install (root)
2. cd ui && npm install
3. Check ui/.env.local for API key
   - If missing/placeholder → Ask user for API key → Create file
   - If valid → Continue
4. npx kill-port 3000
5. cd ui && npm run dev
6. Tell user: "App running at http://localhost:3000"
```

---

## Architecture

The 10X Accountability Coach is a self-contained coaching app powered by the OpenAnalyst API.

```
User (UI) → Next.js API Route → OpenAnalyst API → Streaming Response → UI
```

**Key Features:**
- Single command startup - no second terminal needed
- AI-powered streaming chat responses
- Skills system for structured operations
- Personalized coaching based on user context

---

## API Key Setup

### Where to Get API Key
1. Visit **https://10x.events/api-key**
2. Enter email address
3. Receive API key via email

### API Key Format
```
sk-oa-v1-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Environment File Location
```
ui/.env.local   ← API key goes here (git-ignored, private)
```

### Environment File Content
```env
# OpenAnalyst AI API (Required)
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=sk-oa-v1-YOUR-ACTUAL-KEY-HERE
OPENANALYST_MODEL=openanalyst-beta

# Gemini AI (Optional - for image generation)
# GEMINI_API_KEY=your-gemini-key-here
```

---

## Common User Commands & How to Handle Them

| User Says | Claude Code Action |
|-----------|-------------------|
| "start my app" | Run full setup flow above |
| "run the app" | Run full setup flow above |
| "set up the project" | Run full setup flow above |
| "install dependencies" | `npm install && cd ui && npm install` |
| "start the server" | `npx kill-port 3000 && cd ui && npm run dev` |
| "check API status" | Check `ui/.env.local` and report status |
| "update my API key" | Ask for new key and update `ui/.env.local` |
| "stop the server" | `npx kill-port 3000` |

---

## Skills System

20 skills + 6 commands for structured operations:

### Slash Commands
- `/streak` - Check in to challenge
- `/streak-new` - Create new challenge
- `/streak-list` - List all challenges
- `/streak-stats` - View statistics
- `/streak-switch` - Switch active challenge
- `/streak-insights` - Cross-challenge insights

### Skill Matching
When user says "check in" or "/streak", the system:
1. Matches the skill from `skills/` directory
2. Injects skill instructions into the AI prompt
3. AI follows the skill-specific behavior

---

## Data Structure

```
data/
├── profiles/{user-id}/
│   ├── profile.md
│   ├── challenges/
│   ├── todos/
│   ├── checkins/
│   └── chats/
├── challenges/{challenge-id}/
│   ├── challenge.md
│   └── days/
├── skills/          # Skill definitions
├── schemas/         # Supabase SQL schemas
└── commands/        # Slash commands
```

---

## Project Structure

```
10x-Accountability-Coach/
├── ui/                     # Next.js frontend
│   ├── app/               # Pages & API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities & stores
│   └── .env.local         # API keys (CREATE THIS!)
├── data/                  # User data (file-based)
├── skills/                # AI Skills (20+)
├── commands/              # Slash commands
├── scripts/               # Setup scripts
├── CLAUDE.md              # THIS FILE - Claude Code instructions
└── README.md              # User documentation
```

---

## Troubleshooting

### "API Disconnected" in Settings UI
1. Check `ui/.env.local` has real API key (not placeholder)
2. Restart dev server: `npx kill-port 3000 && cd ui && npm run dev`

### Port Already in Use
```bash
npx kill-port 3000 3001 3002
cd ui && npm run dev
```

### Dependencies Not Installing
```bash
rm -rf node_modules ui/node_modules
npm install && cd ui && npm install
```

### Build Errors
```bash
cd ui && rm -rf .next && npm run build
```

---

## Summary

**When user wants to start the app, Claude Code should:**

1. ✅ Install all dependencies automatically
2. ✅ Check for API key, ask user if missing
3. ✅ Create `ui/.env.local` with user's API key
4. ✅ Kill any process on port 3000
5. ✅ Start the dev server
6. ✅ Tell user the app is running at http://localhost:3000

**The user should only need to:**
1. Open Claude Code in this project
2. Say "start my app"
3. Provide API key if asked
4. Open http://localhost:3000

---

*Developed by Team 10X | Powered by OpenAnalyst*
