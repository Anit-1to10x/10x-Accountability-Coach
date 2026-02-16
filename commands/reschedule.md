---
description: Reschedule a todo or task to a new date/time intelligently
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="reschedule">Reschedule task</cmd>
<ref>skills/schedule-replanner/SKILL.md</ref>

<input>/reschedule [todoId] --to date</input>

<steps>
1. If no ID, show today's tasks and ask which to reschedule
2. Read todo from data/profiles/{profileId}/todos/{todoId}.json
3. Show current due date
4. If --to provided, use that; otherwise suggest: tomorrow, next free slot, end of week
5. Check for scheduling conflicts on target date
6. Update dueDate, add rescheduledFrom field
7. Warn if target date is overloaded
</steps>

<output>Rescheduled '{text}' from {old} → {new}</output>
