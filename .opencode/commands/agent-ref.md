---
description: Add reference files to an agent for context-aware conversations
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="agent-ref">Manage agent references</cmd>

<input>/agent-ref [agentId] --add|--list</input>

<steps>
1. --list: show all files in data/agents/{id}/files/ and data/agents/{id}/notes/
2. --add: ask user to describe or provide reference content
3. Save to data/agents/{id}/files/{filename}
4. Update {id}.md to mention available references
</steps>

Supported: .md, .json, .txt, .pdf

<output>
References for {name}:
  files/{filename} - description
  notes/{filename} - description
</output>
