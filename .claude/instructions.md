# 10X Accountability Coach - Claude Code Startup

## Startup Behavior (STRICT)

1. Read `.setup-log.json` using the Read tool (NOT bash)
2. If `setupComplete: true` → Run RETURNING USER FLOW (below)
3. If `setupComplete: false` or file missing → Follow CLAUDE.md FULL SETUP FLOW exactly

## Returning User Flow (EXACT commands, nothing else)

```bash
npx kill-port 3000
```
Then:
```bash
cd ui && npm run dev
```

App MUST run on port 3000. No other port. No questions. No exploration.

Say: "Your app is running at http://localhost:3000. Terminal ready for slash commands (`/help`)."

## Rules

- DO NOT explore, search, or read files during startup
- DO NOT run alternative commands — only the exact commands listed above
- DO NOT install global packages
- DO NOT use `rm -rf`, `del /q`, `cat`, `echo >`, or any platform-specific commands
- Use `npx kill-port` to kill ports, `npx rimraf` to delete files/dirs
- If something fails, STOP and tell the user. Do NOT improvise

## Slash Commands

37 commands in `.claude/commands/` and `commands/`. Type `/help` to list all.

Key commands:
- `/streak` — Check in to challenge
- `/agent-new` — Create custom AI agent
- `/todo-add` — Add todo task
- `/checkin` — Daily check-in
- `/plan-new` — Create plan

## Architecture

- **CLI (Claude Code)** = Brain — creates content, runs commands, writes to data/ files
- **UI (localhost:3000)** = Display — reads data/ files, shows in browser
- **OpenAnalyst API** = AI — powers both CLI and UI chat
- **Local Files** = Data layer — all data in ./data/ directory

## Chat Context

Chat sends last 10 messages as history (~3000 token budget).
Messages persist to `data/chats/{date}/{agentId}.md`.
