---
description: Add a new todo task with priority, due date, and optional challenge link
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="todo-add">Add new todo</cmd>

<input>/todo-add [text] --priority high|medium|low --due date</input>

<steps>
1. If no text, ask: "What do you need to do?"
2. Ask priority (default: medium)
3. Ask due date (default: today)
4. Ask if linked to active challenge (default: yes if active)
5. Generate unique ID: todo-{timestamp}
6. Save to data/profiles/{profileId}/todos/{todoId}.json (or data/todos/ if no profile)
7. Confirm creation
</steps>

<data path="data/profiles/{profileId}/todos/{todoId}.json">
{id, profileId, text, priority, status:"pending", dueDate, challengeId, createdAt, completedAt:null}
</data>

<output>Todo added: {text} (due: {date}, priority: {priority})</output>
