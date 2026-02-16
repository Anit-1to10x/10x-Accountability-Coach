---
description: View your vision board - goals, affirmations, and visual inspiration
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="visionboard">View vision board</cmd>

<steps>
1. Read vision boards from data/profiles/{profileId}/visionboards/
2. Find active vision board
3. Cross-reference goals with challenges/plans for progress
4. Display goals with progress indicators
5. Show affirmations
6. Link to active challenges
</steps>

<output>
Vision Board: {name}
Goals with progress percentages
Affirmations list
Linked challenges
Commands: /visionboard-new
</output>

If none exists, suggest /visionboard-new.
