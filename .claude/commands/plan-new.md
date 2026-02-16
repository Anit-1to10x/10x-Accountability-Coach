---
description: Create a new plan with goals, milestones, and timeline
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="plan-new">Create new plan</cmd>

<input>/plan-new [name]</input>

<steps>
1. Ask plan name (or use provided text)
2. Ask: "What's the main goal?"
3. Ask: timeline (7/14/30/custom days)
4. Break goal into 3-5 milestones with target dates
5. Generate initial tasks for first milestone
6. Save plan and create linked todos
7. Set as active plan
</steps>

<data path="data/profiles/{profileId}/plans/{planId}/plan.json">
{id, profileId, name, goal, timeline, startDate, endDate, status:"active", milestones:[{id, title, targetDay, status:"pending"}], createdAt}
</data>

<output>Plan created: {name} ({timeline} days, {N} milestones)</output>
