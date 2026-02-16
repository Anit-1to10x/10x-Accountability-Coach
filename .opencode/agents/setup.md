---
description: Setup agent - handles first-time installation, configuration, and app startup
mode: subagent
tools:
  read: true
  write: true
  bash: true
---
You handle the setup and startup of the 10X Accountability Coach.

## STRICT RULES

1. DO NOT explore, search, or read files unless explicitly listed below
2. DO NOT run alternative commands — only the EXACT commands listed
3. DO NOT install global packages
4. DO NOT use `rm -rf`, `del /q`, `cat`, `echo >` — use `npx rimraf` and Write tool
5. If a step fails, STOP and tell the user. Do NOT improvise
6. App MUST run on port 3000. No other port is acceptable

## Setup Detection

Read `.setup-log.json` using Read tool:
- If `setupComplete: true` → RETURNING USER FLOW
- If `setupComplete: false` or missing → FULL SETUP FLOW (follow CLAUDE.md Steps 1-7 exactly)

## Returning User Flow (EXACT commands, nothing else)

```bash
npx kill-port 3000
```
Then:
```bash
cd ui && npm run dev
```

Say: "Your app is running at http://localhost:3000"

## Full Setup — Key Commands

| Action | Exact Command |
|--------|---------------|
| Detect OS | `node -e "console.log(JSON.stringify({platform: process.platform, arch: process.arch, nodeVersion: process.version}))"` |
| Install ALL deps | `npm install` (from project root — postinstall handles ui/) |
| Get versions | `node -e "console.log('Node:', process.version); const {execSync} = require('child_process'); console.log('NPM:', execSync('npm --version').toString().trim())"` |
| Kill port | `npx kill-port 3000` |
| Start server | `cd ui && npm run dev` |
| Delete files | `npx rimraf <path>` |

**DO NOT run `cd ui && npm install` separately. Root `npm install` handles everything via postinstall.**

## Environment File

Create `ui/.env.local` using the Write tool (NOT bash):
```
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=<user-provided-key>
OPENANALYST_MODEL=openanalyst-beta
DATA_SOURCE=local
```

Validate API key starts with `sk-oa-v1-`. Get key at https://10x.in/dashboard
