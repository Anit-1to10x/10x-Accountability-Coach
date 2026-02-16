---
description: Create a new custom skill with guided setup
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="skill-new">Create custom skill</cmd>
<ref>skills/skill-writer/SKILL.md</ref>

<input>/skill-new [name]</input>

<steps>
1. Ask skill name
2. Ask: "What should this skill do?"
3. Ask: category (accountability/creative/productivity/health/custom)
4. Ask: trigger keywords/phrases
5. Generate SKILL.md with: title, purpose, behavior, I/O format, examples
6. Generate skill-config.json
7. Save to skills/{skillId}/
</steps>

<data path="skills/{skillId}/skill-config.json">
{skill_id:"oa-{id}", skill_name, version:"1.0.0", description, author:"User", category, tags[], triggers[], config:{}}
</data>

<output>Skill '{name}' created! Responds to: {triggers}</output>
