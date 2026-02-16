---
description: View your todos - see pending, completed, and overdue tasks
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="todo">View all todos</cmd>

<steps>
1. Read active profile from data/profiles/
2. Read todos from data/profiles/{profileId}/todos/
3. Sort: overdue first, then today, then upcoming
4. Display formatted table with status indicators
5. Show summary: pending, completed, overdue counts
</steps>

<output>
| Status | Task | Priority | Due | Challenge |
|--------|------|----------|-----|-----------|
| ⬜/✅ | text | high/med/low | date | name |

Pending: N | Completed: N | Overdue: N
Commands: /todo-add, /todo-complete [id], /reschedule [id]
</output>

If no todos, suggest /todo-add.
