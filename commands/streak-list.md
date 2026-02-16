---
description: List all your challenges with status, streak, and progress
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="streak-list">List all challenges</cmd>

<steps>
1. Read .streak/challenges/ directory
2. For each challenge, read challenge-config.md
3. Calculate days since last check-in
4. Format table, mark active with *
</steps>

<output>
| Status | Name | Type | Streak | Last Check-in | Progress |
|--------|------|------|--------|---------------|----------|
| * | name | type | N days | N days ago | N sessions |

Commands: /streak-switch [name], /streak, /streak-new
</output>
