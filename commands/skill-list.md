---
description: List all available skills with categories and descriptions
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="skill-list">List all AI skills</cmd>

<input>/skill-list --category name</input>

<steps>
1. Read all skill directories from skills/
2. For each, read SKILL.md header and skill-config.json if exists
3. Group by category (accountability, creative, health, productivity, system)
4. Display formatted list with descriptions
</steps>

<output>
Skills grouped by category:
Accountability: streak, daily-checkin, motivation, punishment, wisdom-accountability-coach
Creative: ai-creative-strategist, ai-image-generation, ai-product-photo, ai-product-video, ai-social-graphics, ai-talking-head
Health: nutritional-specialist, workout-program-designer
Productivity: schedule-replanner, reinforcement-drills
System: skill-writer, user-onboarding, challenge-onboarding, excalidraw
</output>
