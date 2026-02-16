---
description: View your schedule - today's plan, upcoming tasks, and calendar overview
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="schedule">View schedule</cmd>

<input>/schedule --today --week --date YYYY-MM-DD</input>

<steps>
1. Read todos from data/profiles/{profileId}/todos/ with due dates
2. Read challenge schedule from active challenge config
3. Combine and sort by date/time
4. Group by time blocks (morning/afternoon/evening)
5. Show today first, then upcoming
6. Highlight overdue items
</steps>

<output>
Today's Schedule (date):
Morning: tasks...
Afternoon: tasks...
Upcoming: future tasks...
Commands: /reschedule, /todo-add
</output>
