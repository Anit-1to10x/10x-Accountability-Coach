---
description: Delete an agent and optionally its workspace data
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="agent-delete">Delete agent</cmd>

<input>/agent-delete [agentId] --keep-files</input>

<steps>
1. If no ID, list agents and ask which to delete
2. Check if default agent (isDefault:true) → refuse
3. Show details, ask confirmation
4. Remove from data/agents.json
5. Remove from data/agent-capabilities.json
6. Unless --keep-files: delete data/agents/{id}/ directory
</steps>

<output>Agent '{name}' deleted.</output>
