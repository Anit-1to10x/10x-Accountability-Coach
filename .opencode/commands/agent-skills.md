---
description: Manage an agent's assigned skills - add, remove, or view
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="agent-skills">Manage agent skills</cmd>

<input>/agent-skills [agentId] --add [skill]|--remove [skill]</input>

<steps>
1. If no ID, list agents and ask which one
2. Read agent skills from data/agent-capabilities.json
3. Read available skills from skills/ directory
4. Show assigned vs available
5. --add: add to assignedSkills array
6. --remove: remove from array
7. Update agent-capabilities.json, agents/{id}/agent.json, {id}.md
</steps>

<output>
Assigned: ✅ skill1, ✅ skill2
Available: ⬜ skill3, ⬜ skill4
</output>
