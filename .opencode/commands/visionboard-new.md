---
description: Create a new vision board with goals, affirmations, and visual themes
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="visionboard-new">Create vision board</cmd>

<input>/visionboard-new [name]</input>

<steps>
1. Ask vision board name
2. Ask: "Top 3-5 goals?" (with target and timeline each)
3. Ask: "What affirmations keep you motivated?" (or generate suggestions)
4. Ask: visual theme (minimalist/bold/nature/tech/custom)
5. Save vision board
6. Link goals to existing challenges if matching
</steps>

<data path="data/profiles/{profileId}/visionboards/{vbId}.json">
{id, profileId, name, goals:[{title, target, deadline, progress:0}], affirmations[], theme, createdAt}
</data>

<output>Vision board created: {name} with {N} goals</output>
