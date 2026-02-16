---
description: Check in to your active challenge - log progress, get insights
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="streak">Check in to active challenge</cmd>
<ref>skills/streak/SKILL.md</ref>

<steps>
1. Read .streak/active.md to find active challenge
2. Read challenge config, calculate streak status (count, days since last check-in)
3. Show status: streak count, on-track/overdue
4. Ask energy/time and focus questions
5. If pre-session: offer ideation suggestions based on type
6. If post-session: ask wrap-up questions and log
7. Update files and generate insights
8. Log progress to challenge-log.md
</steps>

<output>Streak status, insights, updated count</output>

If no .streak/ folder exists, prompt user to run /streak-new first.
