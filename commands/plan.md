---
description: View your active plan with milestones, progress, and next steps
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="plan">View active plan</cmd>

<steps>
1. Read plans from data/profiles/{profileId}/plans/
2. Find active plan
3. Calculate progress from completed milestones
4. Show milestone timeline with status
5. Highlight next milestone
6. Show today's relevant tasks
</steps>

<output>
Plan: {name} | Progress: N% | {completed}/{total} milestones
Milestone timeline with ✅/⬜ status
Today's focus tasks
Commands: /plan-new, /todo-add
</output>

If no plan, suggest /plan-new.
