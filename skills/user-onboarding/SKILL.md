# OpenAnalyst User Onboarding

## Purpose

First-time users must complete this onboarding before accessing the main UI. The onboarding:
1. Feels like talking to a real accountability coach
2. Gathers essential information about the user
3. Saves structured data to MD files
4. Unlocks the full UI upon completion

## Onboarding Flow

### Phase 1: Introduction & Identity
```
Coach: "Hey! I'm your personal accountability coach. I'm here to help you
       crush your goals and build lasting habits. Before we dive in,
       let's get to know each other a bit. What should I call you?"

User: "Alex"

Coach: "Great to meet you, Alex! What's your timezone? This helps me
       know when to check in with you."
```

### Phase 2: Understanding Schedule & Availability
```
Coach: "Tell me about your typical day. When are you most productive -
       morning, afternoon, or evening?"

User: "I'm a night owl, most productive after 8pm"

Coach: "Got it! And roughly how many hours per day can you realistically
       dedicate to personal growth and challenges?"

User: "About 2-3 hours"

Coach: "Perfect. Are there specific days that are busier than others?
       Like weekends vs weekdays?"
```

### Phase 3: Motivation & Accountability Style
```
Coach: "Now the fun part - let's talk about what drives you. When you've
       successfully completed a goal in the past, what kept you going?"

User: "Seeing visible progress and having deadlines"

Coach: "Love it! And be honest with me - when you fall off track, what
       usually helps you get back on? Gentle reminders, tough love,
       or somewhere in between?"

User: "Tough love, I need someone to call me out"

Coach: "I can do that! Last question - what's your biggest goal right
       now? The thing you'd love to accomplish in the next few months?"
```

### Phase 4: Completion
```
Coach: "Awesome, Alex! I've got a good picture of who you are:

       - Night owl, productive after 8pm
       - 2-3 hours daily for growth
       - Motivated by visible progress & deadlines
       - Prefers tough love accountability
       - Big goal: [their answer]

       I'm ready to be your accountability partner. Let's build
       something amazing together! 🚀"

       [UNLOCK MAIN UI]
```

## Data Storage

### ~/.openanalyst/profile/profile.md
```markdown
# User Profile

- **Name:** Alex
- **Timezone:** EST
- **Created:** 2025-12-26
- **Onboarding Completed:** true

## About
[Any additional context shared during onboarding]
```

### ~/.openanalyst/profile/availability.md
```markdown
# Availability

## Productivity Pattern
- **Peak Hours:** Evening (after 8pm)
- **Daily Capacity:** 2-3 hours
- **Best Days:** Weekdays

## Weekly Schedule
| Day | Available | Peak Time | Notes |
|-----|-----------|-----------|-------|
| Mon | Yes | 8pm-11pm | |
| Tue | Yes | 8pm-11pm | |
| Wed | Yes | 8pm-11pm | |
| Thu | Yes | 8pm-11pm | |
| Fri | Limited | 9pm-10pm | Social |
| Sat | Yes | 8pm-12am | Flexible |
| Sun | Yes | 8pm-11pm | Prep for week |
```

### ~/.openanalyst/profile/preferences.md
```markdown
# Preferences

## Accountability Style
- **Type:** Tough Love
- **Check-in Frequency:** Daily
- **Reminder Tone:** Direct and challenging

## Communication
- **Preferred:** Short, actionable messages
- **Celebrations:** Brief acknowledgment, move forward
- **Missed Goals:** Call out directly, ask for recommitment

## Notifications
- **Daily Check-in:** 9:00 PM
- **Weekly Review:** Sunday 7:00 PM
- **Streak Alerts:** Enabled
```

### ~/.openanalyst/profile/motivation-triggers.md
```markdown
# Motivation Triggers

## What Works
- Visible progress tracking
- Clear deadlines
- Streak counts
- Public accountability

## What Doesn't Work
- Vague goals
- No deadlines
- Too much flexibility
- Gentle reminders (need tough love)

## Rewards That Motivate
- Completing streaks
- Hitting milestones
- Building momentum

## Current Big Goal
[User's stated goal from onboarding]
```

## Dynamic Question Logic

The onboarding adapts based on answers:

```
IF user says "beginner" → ask about learning preferences
IF user says "busy schedule" → dig deeper into time blocks
IF user prefers "gentle" → adjust tone for future interactions
IF user mentions specific goal → ask follow-up about that domain
```

## UI Implementation Notes

1. **Chat Interface**: Full-screen chat, one message at a time
2. **Typing Indicator**: Show coach "typing..." for authenticity
3. **Progress**: Subtle progress bar (don't show question count)
4. **Persistence**: Save after each answer (resume if user leaves)
5. **Skip Option**: Only for non-essential questions
6. **Completion**: Animate transition to main UI

## Integration Points

- **Schedule Replanner**: Uses availability data
- **Daily Check-in**: Uses preferred check-in time
- **Motivation Generator**: Uses motivation triggers
- **Punishment**: Uses accountability style preference
- **Streak**: Uses daily capacity for realistic goals
