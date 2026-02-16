---
description: Show all available commands with descriptions and usage
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="help">Show all commands</cmd>

<input>/help [command-name]</input>

<steps>
1. If no argument, display full command table below
2. If command name given, read commands/{name}.md and show detailed usage
</steps>

<output>
## Streaks & Challenges
/streak - Check in to active challenge
/streak-new - Create a new challenge
/streak-list - List all challenges
/streak-stats - View challenge statistics
/streak-switch - Switch active challenge
/streak-insights - Cross-challenge insights
/challenge - Browse challenge templates

## Agents
/agent - View all agents
/agent-new - Create a new custom agent
/agent-edit - Edit agent settings
/agent-skills - Manage agent skills
/agent-delete - Delete an agent
/agent-chat - Chat with a specific agent
/agent-ref - Add reference files to agent

## Todos & Schedule
/todo - View all todos
/todo-add - Add a new todo
/todo-list - List todos with filters
/todo-complete - Mark todo as done
/schedule - View your schedule
/reschedule - Reschedule a task

## Check-ins & Motivation
/checkin - Daily accountability check-in
/checkin-history - View check-in history
/motivate - Get a motivation boost

## Planning & Vision
/plan - View active plan
/plan-new - Create a new plan
/visionboard - View vision board
/visionboard-new - Create a vision board

## Accountability
/contract - Create/view accountability contract
/punishment - Manage consequences

## Skills & Tools
/skill-list - List all AI skills
/skill-new - Create a custom skill
/prompt - Manage prompt templates

## Workspace & System
/workspace - View workspace overview
/asset - Manage assets
/history - View activity history
/onboard - Run onboarding setup
/help - Show this help
</output>
