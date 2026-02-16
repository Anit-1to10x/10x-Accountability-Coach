---
description: View all your agents with status, skills, and personality
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="agent">View all agents</cmd>

<steps>
1. Read data/agents.json for agent list
2. Read data/agent-capabilities.json for capabilities
3. Cross-reference with data/agents/{id}/ folders
4. Display table with name, skills count, personality
</steps>

<output>
| Status | Agent | Skills | Personality |
|--------|-------|--------|-------------|
| 🟢/⚪ | name | skill1, skill2 | tone, style |

Commands: /agent-new, /agent-edit [id], /agent-chat [id]
</output>
