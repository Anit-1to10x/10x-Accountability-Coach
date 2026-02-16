---
description: Do your daily check-in - log mood, wins, blockers, and tomorrow's plan
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="checkin">Daily accountability check-in</cmd>
<ref>skills/daily-checkin/SKILL.md</ref>

<steps>
1. Read active profile from data/profiles/
2. Check existing check-in today in data/profiles/{profileId}/checkins/
3. If exists, ask to update
4. Ask: mood (crushed-it/good/meh/struggled)
5. Ask: wins (what you accomplished)
6. Ask: blockers (what didn't go as planned)
7. Ask: tomorrow's #1 priority
8. Ask: score (1-10)
9. Save to data/profiles/{profileId}/checkins/{date}.json (or data/checkins/ if no profile)
10. Update streak if challenge linked
11. Show streak status + encouragement
</steps>

<data path="data/profiles/{profileId}/checkins/{date}.json">
{date, profileId, mood, score, wins[], blockers[], tomorrowPriority, challengeId, streakDay, createdAt}
</data>

<output>Check-in saved. Streak: N days. Encouragement message.</output>
