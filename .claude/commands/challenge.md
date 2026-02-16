---
description: View available challenge templates and your active challenge progress
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="challenge">Browse challenges</cmd>

<input>/challenge --browse --active</input>

<steps>
1. Read challenge templates from data/challenges/
2. Read active challenge from .streak/active.md
3. If active, show progress summary
4. List all available templates with descriptions (read each challenge.md)
5. Suggest: /streak-new, /streak, /streak-stats
</steps>

<output>
Active: {name} Day N/30 | Streak: N | Status
Available templates list with descriptions
</output>
