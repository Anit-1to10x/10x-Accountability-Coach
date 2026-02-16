---
description: Switch to a different active challenge
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="streak-switch">Switch active challenge</cmd>

<input>/streak-switch [challenge-name]</input>

<steps>
1. If no name given, list all challenges and ask which to activate
2. Verify challenge exists in .streak/challenges/
3. If not found, suggest closest match
4. Update .streak/active.md with new challenge ID
5. Show new active challenge status
</steps>

<output>Switched to '{name}'. Type: X | Streak: N days | Last: N days ago. Run /streak to check in.</output>
