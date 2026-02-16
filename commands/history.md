---
description: View your activity history - check-ins, completions, and milestones
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="history">Activity history</cmd>

<input>/history --last N --type checkins|todos</input>

<steps>
1. Read check-ins from data/profiles/{profileId}/checkins/
2. Read completed todos from data/profiles/{profileId}/todos/
3. Read challenge logs from .streak/challenges/
4. Merge all events into timeline sorted by date
5. Apply filters (--last N days, --type)
6. Display formatted timeline
7. Show summary stats
</steps>

<output>
Timeline by date:
  ✅ Completed todos
  📝 Check-ins with scores
  🔥 Streak milestones
Summary: todos completed, check-ins, streak days
</output>
