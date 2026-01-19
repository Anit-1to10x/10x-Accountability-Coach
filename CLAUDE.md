# 10X Accountability Coach - Claude Code Instructions

## IMPORTANT: Cross-Platform System Detection

**Before running ANY commands**, Claude Code must detect the operating system:

### How to Detect the OS
Use the `process.platform` from Node.js or check the environment:

**Windows Detection:**
- `process.platform === 'win32'`
- Path separators use `\`
- Commands use Windows syntax

**Mac/Linux Detection:**
- `process.platform === 'darwin'` (Mac) or `process.platform === 'linux'`
- Path separators use `/`
- Commands use Unix syntax

### Dynamic Command Execution
Always use **cross-platform commands** that work on both systems:

| Task | Cross-Platform Command |
|------|------------------------|
| Install deps | `npm install` (works everywhere) |
| Change directory | `cd ui` (works everywhere) |
| Kill port | `npx kill-port 3000` (works everywhere) |
| Read file | Use the Read tool (not `cat`) |
| Check file exists | Use Glob tool or `fs.existsSync` |
| Create directory | `mkdir -p` or use `fs.mkdirSync` |

---

## IMPORTANT: Auto-Setup Instructions for Claude Code

When a user says **"start my app"**, **"run the app"**, **"set up the project"**, or similar commands, Claude Code (YOU) must automatically perform the following steps:

### Step 1: Detect Operating System

**Use Bash to check the platform:**
```bash
node -e "console.log(process.platform)"
```

This will return:
- `win32` for Windows
- `darwin` for Mac
- `linux` for Linux

### Step 2: Install Dependencies (Cross-Platform)

These commands work on ALL platforms:
```bash
# Install root dependencies
npm install

# Install UI dependencies
cd ui && npm install
```

### Step 3: Check for API Key Configuration

**Use the Read tool** to check `ui/.env.local` (NOT cat command):
- Read the file using Claude Code's Read tool
- Check if it contains a valid API key (not placeholder)

**If the file doesn't exist OR contains placeholder `sk-oa-v1-your-key-here`:**

1. Ask the user: "Do you have an OpenAnalyst API key? If not, get one at https://10x.events/api-key"
2. Once user provides the key, create `ui/.env.local` using the Write tool:

```env
# OpenAnalyst AI API (Required)
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=<USER'S ACTUAL API KEY>
OPENANALYST_MODEL=openanalyst-beta
```

### Step 4: Kill Any Existing Processes on Port 3000

**Cross-platform command (works on Windows, Mac, Linux):**
```bash
npx kill-port 3000
```

### Step 5: Start the Application

```bash
cd ui && npm run dev
```

### Step 6: Confirm to User

Tell the user: "Your 10X Accountability Coach is running at http://localhost:3000"

---

## One-Command Setup Flow

When user says "start my app", execute this flow:

```
1. Detect OS: node -e "console.log(process.platform)"
2. npm install (root) - cross-platform
3. cd ui && npm install - cross-platform
4. Check ui/.env.local for API key (use Read tool)
   - If missing/placeholder → Ask user for API key → Create file (use Write tool)
   - If valid → Continue
5. npx kill-port 3000 - cross-platform
6. cd ui && npm run dev - cross-platform
7. Tell user: "App running at http://localhost:3000"
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

**Cross-platform (use these commands on ANY system):**
```bash
# Remove node_modules (works on Windows, Mac, Linux)
npx rimraf node_modules ui/node_modules

# Reinstall
npm install && cd ui && npm install
```

**Or use the Bash tool with platform-specific commands:**
- **Windows:** `rmdir /s /q node_modules ui\node_modules`
- **Mac/Linux:** `rm -rf node_modules ui/node_modules`

### Build Errors

**Cross-platform:**
```bash
cd ui && npx rimraf .next && npm run build
```

### Path Issues on Different Operating Systems

The app uses `path.sep` and cross-platform path utilities. If you encounter path-related errors:

1. **Check paths.ts** - Uses `path.basename()` and `path.sep` for cross-platform compatibility
2. **Check data-source.ts** - Uses environment variables without path hardcoding
3. **Restart the dev server** after making changes

### Data Source Issues

The app supports three data sources with this priority:
1. **MCP** - When MCP is configured and enabled
2. **Supabase** - When toggled ON in settings AND configured
3. **Local** - Default fallback

To check which data source is active:
- Look at the data source indicator in the UI
- Check `ui/lib/data-source.ts` for the logic

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
