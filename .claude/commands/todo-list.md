---
description: List todos filtered by status, priority, or challenge
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="todo-list">List todos with filters</cmd>

<input>/todo-list --status pending|completed|all --priority high|medium|low --challenge id --overdue</input>

<steps>
1. Read all todos from data/profiles/{profileId}/todos/
2. Apply filters (default: status=pending)
3. Sort: overdue first, then due date, then priority
4. Display formatted table
5. Show filter-specific counts
</steps>

<output>Filtered todo table with counts and suggested commands</output>
