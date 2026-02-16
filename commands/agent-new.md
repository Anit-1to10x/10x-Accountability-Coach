---
description: Create a new AI agent with custom personality, skills, and behavior
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="agent-new">Create custom agent</cmd>

<input>/agent-new [name] --type fitness|finance|learning|career|creative|general</input>

<steps>
1. Ask agent name (or use provided)
2. Ask: "What should this agent help with?" (description)
3. Auto-detect type from name/description keywords
4. Ask personality preset:
   - drill-sergeant (strict, no-excuses)
   - best-friend (warm, casual)
   - mentor (wise, patient)
   - hype-man (high-energy)
   - professor (analytical, structured)
   - custom (user picks tone + style)
5. Show available skills grouped by category, let user pick
6. Pick icon emoji and color
7. Generate system prompt from answers
8. Create folder: data/agents/{agentId}/ with subdirs: files, images, videos, summaries, notes, exports, chats, generated
9. Write: agent.json, {agentId}.md, README.md
10. Update data/agents.json (append to agents array)
11. Update data/agent-capabilities.json (add entry)
</steps>

<data path="data/agents/{agentId}/agent.json">
{id, name, icon, color, avatar, description, skills[], capabilities[], personality:{tone,style}, createdAt, updatedAt}
</data>

<data path="data/agent-capabilities.json" key="{agentId}">
{agentId, assignedSkills[], assignedPrompts[], systemPrompt, personality:{tone,style}, restrictions:{allowOnlyAssigned,blockedTopics[]}, updatedAt}
</data>

<output>Agent '{name}' created! Select in sidebar to chat. Add references with /agent-ref {id}</output>
