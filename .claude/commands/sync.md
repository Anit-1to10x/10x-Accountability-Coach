---
description: Sync local file changes with the UI in real-time
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="sync">Force-sync local files with the browser UI</cmd>

<input>/sync</input>

<ref>skills/workspace-management/SKILL.md</ref>

<steps>
1. Call POST http://localhost:3000/api/sync to trigger UI refresh
2. Display summary of synced data (challenges, skills, prompts)
3. Confirm UI has been notified to refresh all stores
</steps>

<data path="POST http://localhost:3000/api/sync">
Response: { success, message, synced: { challenges, skills, prompts } }
</data>

<output>
## Sync Complete

Notified the UI to refresh:
- {N} challenges
- {N} skills
- {N} prompts

The browser UI will auto-refresh within 1 second.
If the UI is not open, changes will load when you next open http://localhost:3000.
</output>
