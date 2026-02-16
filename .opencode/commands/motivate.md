---
description: Get a personalized motivation boost based on your progress and mood
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="motivate">Personalized motivation</cmd>
<ref>skills/motivation/SKILL.md</ref>

<input>/motivate --style tough-love|gentle|wisdom|hype|auto</input>

<options>
| Style | Description |
|-------|-------------|
| tough-love | Direct, no-excuses |
| gentle | Supportive, empathetic |
| wisdom | Philosophical, perspective |
| hype | High-energy, pump-up |
| auto | Adapts from profile (default) |
</options>

<steps>
1. Read active profile and accountability style
2. Read recent check-ins for mood context
3. Read active challenge progress
4. Select style (from flag or auto-detect)
5. Generate personalized motivation considering: streak, mood trend, milestones
6. Optionally save to data/profiles/{profileId}/motivation/{date}.md
</steps>

<output>Personalized motivation message in selected style</output>
