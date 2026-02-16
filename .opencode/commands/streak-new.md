---
description: Create a new challenge with guided setup (learning, building, fitness, habit, creative, custom)
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="streak-new">Create new challenge</cmd>
<ref>skills/streak/SKILL.md</ref>

<options>
| Type | Best For |
|------|----------|
| learning | Courses, skills, books |
| building | Projects, shipping, coding |
| fitness | Workouts, health goals |
| creative | Art, writing, music |
| habit | Routines, consistency |
| custom | Define your own |
</options>

<steps>
1. Initialize .streak/ folder if needed
2. Ask challenge type (from options above)
3. Ask basic info: name, goal, cadence
4. Ask type-specific questions
5. Create all challenge files with pre-filled preferences
6. Set as active challenge
7. Offer first check-in
</steps>

<data path=".streak/challenges/{challenge-id}/">
Files: challenge-config.md, challenge-log.md, today.md, backlog.md, preferences.md, context.md, insights.md, sessions/
</data>
