---
description: Run the onboarding flow to set up your profile and preferences
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="onboard">Profile setup & onboarding</cmd>
<ref>skills/user-onboarding/SKILL.md</ref>

<input>/onboard --reset</input>

<steps>
1. Check if profile exists in data/profiles/
2. If --reset, clear existing preferences
3. Ask: name, main goal, accountability style (tough-love/supportive/balanced)
4. Ask: check-in time (morning/evening/custom)
5. Save profile to data/profiles/{profileId}/profile.json
6. Update .setup-log.json with onboardingComplete:true
7. Suggest: /streak-new or /todo-add
</steps>

<data path="data/profiles/{profileId}/profile.json">
{id, name, goal, accountabilityStyle, checkinTime, timezone, createdAt, onboardingComplete:true}
</data>
