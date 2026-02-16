---
description: Browse and use saved prompt templates for common tasks
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="prompt">Manage prompt templates</cmd>

<input>/prompt --list|--use [id]|--new</input>

<steps>
1. Default/--list: read prompts from data/profiles/{profileId}/prompts/ or data/prompts/
2. --use [id]: load prompt, fill variables, execute
3. --new: ask name, description, template text with {{variables}}, category; save
</steps>

<data path="data/prompts/{promptId}.json">
{id, name, description, template, variables[], category, createdAt}
</data>

<output>Prompt list, execution result, or creation confirmation</output>
