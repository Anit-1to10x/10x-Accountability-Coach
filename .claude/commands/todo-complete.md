---
description: Mark a todo as completed
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="todo-complete">Complete todo</cmd>

<input>/todo-complete [todoId] --all-overdue</input>

<steps>
1. If no ID, show pending todos and ask which to complete
2. Read todo from data/profiles/{profileId}/todos/{todoId}.json
3. Update: status="completed", completedAt=now
4. Write updated file
5. If challengeId set, update challenge progress
6. Show encouragement + remaining count
</steps>

<output>Completed: {text} | {N} todos remaining</output>
