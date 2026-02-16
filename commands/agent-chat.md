---
description: Start or continue a chat conversation with a specific agent
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="agent-chat">Chat with agent</cmd>

<input>/agent-chat [agentId]</input>

<steps>
1. If no ID, list agents and ask which to chat with
2. Load full config: personality, system prompt, skills from data/agent-capabilities.json
3. Read instruction file: data/agents/{id}/{id}.md
4. Load reference files from data/agents/{id}/files/ and data/agents/{id}/notes/
5. Set agent persona for conversation context
6. Greet user in agent's voice/style
7. Save chat to data/agents/{id}/chats/{sessionId}.json
</steps>

Agent behavior:
- Respond in defined tone and style
- Only use assigned skills if allowOnlyAssigned:true
- Reference its specific knowledge/files
- Stay in character throughout
