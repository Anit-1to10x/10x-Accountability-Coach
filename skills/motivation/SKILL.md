# OpenAnalyst Motivation Generator

Context-aware motivation that actually works - based on user's personal triggers, past wins, and current challenges.

## Purpose

Generic motivation is useless. This skill:
1. Understands what ACTUALLY motivates this specific user
2. References their real progress and wins
3. Connects to their stated goals
4. Adapts tone to their preference
5. Triggers at the right moments

## Anti-Patterns (What We Avoid)

❌ "You can do it!"
❌ "Believe in yourself!"
❌ Generic inspirational quotes
❌ One-size-fits-all pep talks
❌ Empty positivity

## What We Do Instead

✅ "Remember when you thought Python was impossible? You've now completed 15 lessons."
✅ "You said your goal is to land a data science job. Today's struggle is tomorrow's interview answer."
✅ "Your streak is at 12 days. You've never gone this long before. Don't stop now."
✅ "Last Tuesday you crushed it after a rough Monday. Today can be another Tuesday."

## Motivation Types

### 1. Progress-Based
Remind user how far they've come:
```
"When you started 3 weeks ago, you couldn't write a single line of code.
Yesterday you built a working calculator. That's not nothing."
```

### 2. Goal-Connected
Link current struggle to their bigger goal:
```
"You said you want to build a startup. Every bug you fix now is a bug
you'll solve 10x faster when it matters. This is training."
```

### 3. Streak-Powered
Use streak psychology:
```
"18 days. You haven't missed in 18 days. Your past self would be
impressed. Don't let them down."
```

### 4. Contrast-Based
Show the alternative:
```
"You can skip today. And tomorrow. And next week. In a month you'll
be exactly where you are now. Or you can do 30 minutes right now."
```

### 5. Identity-Based
Reinforce who they're becoming:
```
"You told me you want to be someone who finishes what they start.
This is the moment that identity is built. One session at a time."
```

### 6. Past-Win Recall
Reference their actual victories:
```
"December 15th - you checked in after a 12-hour workday. You didn't
feel like it but you did it anyway. Today is easier than that."
```

## Trigger Points

### Automatic Triggers

| Situation | Motivation Type |
|-----------|-----------------|
| Missed check-in | Past-Win Recall |
| Low mood (2 days) | Progress-Based |
| Streak at risk | Streak-Powered |
| Challenge midpoint | Goal-Connected |
| After a break | Identity-Based |

### User-Requested
When user explicitly asks for motivation, use deeper approach:

```
User: "I need some motivation"

Coach: "Let me look at your data...

You started learning Python on December 10th. In 16 days you've:
- Completed 42 lessons
- Maintained a 12-day streak
- Built 3 small projects
- Checked in 14 out of 16 days

Your goal is to land a data science role. At this pace, you'll complete
the fundamentals by mid-January. That's ahead of most people who
'want to learn to code.'

The only thing that can stop you now is you. And you've already proven
you won't let that happen. Now close this and go do 30 minutes."
```

## Data Storage

### ~/.openanalyst/motivation/triggers.md
```markdown
# Motivation Triggers

## What Works (from onboarding + observed)
- Seeing visible progress
- Data and numbers
- Comparison to past self
- Deadline pressure
- Identity reinforcement

## What Doesn't Work
- Vague encouragement
- Comparison to others
- Toxic positivity
- Generic quotes
```

### ~/.openanalyst/motivation/wins-bank.md
```markdown
# Wins Bank

Collection of user's victories for motivation recall.

## Major Wins
- 2025-12-15: Checked in after 12-hour workday
- 2025-12-20: First working Python project
- 2025-12-24: 10-day streak milestone

## Breakthrough Moments
- "When loops finally clicked"
- "First time reading docs without tutorial"

## User's Own Words
- "I actually feel like a programmer now" (Dec 22)
- "Can't believe I built this" (Dec 20)
```

## Tone Adaptation

### Tough Love Users
```
"You didn't sign up for easy. You signed up for results. Stop scrolling,
open your laptop, and do the work. 30 minutes. Go."
```

### Balanced Users
```
"Rough day? It happens. But you know what also happens? You showing up
anyway. You've done it before, you'll do it again. Let's go."
```

### Gentle Users
```
"Hey, I noticed things have been hard lately. That's okay. Progress isn't
linear. Even a small step today counts. What feels manageable right now?"
```

## Integration Points

- **Daily Check-in**: Triggered by low mood
- **Streak**: Pulls streak data for motivation
- **User Onboarding**: Uses motivation triggers
- **Punishment**: Balances punishment with motivation

## UI Components

1. **Motivation Card**: Contextual motivation on dashboard
2. **Win Recall**: Swipeable cards of past victories
3. **Progress Visualization**: Charts showing growth
4. **Quick Boost**: One-tap motivation button
