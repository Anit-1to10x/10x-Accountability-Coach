---
description: Set up or trigger accountability consequences for missed commitments
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="punishment">Accountability consequences</cmd>
<ref>skills/punishment/SKILL.md</ref>

<input>/punishment --setup|--trigger|--history</input>

<steps>
1. Default: show current punishment status and active rules
2. --setup: define rules (e.g., "miss 2 days → extra workout")
3. --trigger: log consequence, update contract missed count
4. --history: read from data/profiles/{profileId}/punishments/
5. Save records to data/profiles/{profileId}/punishments/{id}.json
6. Integrate with streak/check-in for auto-triggers
</steps>

<output>Punishment status, rules, or history depending on mode</output>
