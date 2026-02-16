---
description: Edit an agent's personality, skills, prompts, and behavior settings
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="agent-edit">Edit agent settings</cmd>

<input>/agent-edit [agentId] --personality|--skills|--prompts|--info|--restrictions</input>

<steps>
1. If no ID, list agents and ask which to edit
2. Read agent from data/agents.json + data/agent-capabilities.json + data/agents/{id}/agent.json
3. Show current values, ask what to change
4. Update all three locations: agents.json, agent-capabilities.json, agents/{id}/agent.json, agents/{id}/{id}.md
5. Set updatedAt timestamp
</steps>

<output>Agent '{name}' updated. Changes reflect in UI immediately.</output>
