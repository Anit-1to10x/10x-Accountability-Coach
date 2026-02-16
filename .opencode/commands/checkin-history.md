---
description: View your check-in history with trends, streaks, and mood patterns
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="checkin-history">View check-in history</cmd>

<input>/checkin-history --last N --month YYYY-MM</input>

<steps>
1. Read check-ins from data/profiles/{profileId}/checkins/
2. Apply date filter (default: last 7 days)
3. Calculate averages and trends
4. Display formatted table
5. Show streak and mood trend summary
</steps>

<output>
| Date | Mood | Score | Wins | Streak |
|------|------|-------|------|--------|

Average Score: N | Current Streak: N days | Mood Trend: direction
</output>
