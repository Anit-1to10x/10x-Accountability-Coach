---
description: Create or view an accountability contract with stakes and commitments
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="contract">Accountability contract</cmd>
<ref>skills/punishment/SKILL.md</ref>

<input>/contract --new</input>

<steps>
1. If viewing: read from data/profiles/{profileId}/contracts/
2. If --new or no contract exists:
   a. Ask: "What are you committing to?" (link to challenge or custom)
   b. Ask: duration (7/14/30/90 days)
   c. Ask: stakes (consequences if failed)
   d. Ask: accountability partner (self/friend/public)
   e. Ask confirmation ("sign" the contract)
3. Save and activate
</steps>

<data path="data/profiles/{profileId}/contracts/{contractId}.json">
{id, profileId, commitment, challengeId, duration, startDate, endDate, stakes, partner, status:"active", missedDays:0, signedAt}
</data>

<output>Contract summary with terms and stakes</output>
