---
description: View detailed statistics for your active challenge
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="streak-stats">View challenge statistics</cmd>
<ref>skills/streak/SKILL.md</ref>

<steps>
1. Read active challenge from .streak/active.md
2. Read challenge-config.md and challenge-log.md
3. Calculate: total sessions, current/best streak, avg session length, completion rate
4. Read backlog.md for item counts
5. Detect patterns: best day of week, best time, mood trends
6. Check achievements (First Flame, On Fire, Unstoppable, Diamond, etc.)
7. Display formatted stats
</steps>

<output>Progress stats, streak data, patterns, achievements, backlog status</output>
