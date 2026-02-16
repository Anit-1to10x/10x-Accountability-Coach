# OpenAnalyst Daily Check-in

Structured daily check-ins that adapt based on user's progress, mood, and active challenges.

## Purpose

Daily check-ins are the heartbeat of accountability. This skill:
1. Captures what was accomplished
2. Identifies blockers and wins
3. Plans tomorrow's priorities
4. Maintains streak momentum
5. Adjusts tone based on user's accountability style

## Check-in Flow

### Standard Check-in (2-3 minutes)

```
Coach: "Hey Alex! Time for your daily check-in. How did today go?"

[Quick Mood Selector: 🔥 Crushed it | ✅ Good | 😐 Meh | 😓 Struggled]

User: [Selects "Good"]

Coach: "Nice! Tell me about your wins today - what did you accomplish?"

User: "Completed 2 lessons of the Python course"

Coach: "That's progress! Any blockers or things that didn't go as planned?"

User: "Got distracted by social media for an hour"

Coach: "Happens to the best of us. What's the ONE thing you're committing
       to tomorrow?"

User: "Finish module 3"

Coach: "Locked in. Module 3 tomorrow. I'll check in at 9pm.
       Day 5 streak going strong! 🔥"
```

### Quick Check-in (30 seconds)
For busy days or when user is in a rush:

```
Coach: "Quick check-in! Rate your day 1-5 and one sentence on progress:"

User: "4 - finished the project proposal"

Coach: "Solid 4! Streak continues. See you tomorrow. 💪"
```

### Deep Check-in (Weekly or when struggling)

```
Coach: "Let's do a deeper check-in today. I noticed your streak
       broke yesterday. No judgment - let's understand what happened."

[Series of reflective questions]

Coach: "Based on what you shared, I have some suggestions for
       getting back on track. Want to hear them?"
```

## Data Storage

### ~/.openanalyst/checkins/YYYY-MM-DD.md
```markdown
# Check-in: 2025-12-26

## Summary
- **Mood:** Good (4/5)
- **Streak Day:** 5
- **Check-in Time:** 9:15 PM

## Wins
- Completed 2 lessons of Python course
- Stuck to evening schedule

## Blockers
- Social media distraction (1 hour lost)

## Tomorrow's Commitment
- Finish module 3

## Coach Notes
User maintaining good momentum. Watch for social media pattern.
```

### ~/.openanalyst/checkins/weekly-summary.md
```markdown
# Weekly Summary: Dec 22-28, 2025

## Stats
- **Check-ins Completed:** 6/7
- **Average Mood:** 3.8/5
- **Streak Status:** Active (12 days)

## Wins This Week
- Completed 10 Python lessons
- Built first small project
- Maintained evening routine

## Patterns Noticed
- Most productive: Tuesday, Thursday
- Struggled: Friday (social commitments)
- Blocker theme: Social media

## Next Week Focus
- Implement phone-free first hour of work
- Schedule buffer for Friday
```

## Adaptive Behavior

### Based on Streak Status

| Status | Approach |
|--------|----------|
| Building (1-7 days) | Encouraging, celebrate small wins |
| Strong (8-30 days) | Maintain momentum, introduce challenges |
| Veteran (30+ days) | Respect their system, deeper insights |
| Broken | Compassionate, focus on restart |

### Based on Mood Pattern

| Pattern | Response |
|---------|----------|
| Declining mood | Ask deeper questions, identify root cause |
| Consistently high | Increase challenge difficulty |
| Volatile | Suggest stabilizing routines |
| Consistently low | Adjust goals, reduce scope |

### Based on User's Accountability Style

| Style | Check-in Tone |
|-------|---------------|
| Tough Love | "Did you hit your target? Yes or no." |
| Balanced | "How did today go? What worked?" |
| Gentle | "Hey! Just checking in. How are you feeling about progress?" |

## Integration Points

- **Streak Skill**: Updates streak count, logs to challenge-log.md
- **Motivation Generator**: Triggers when mood is low
- **Schedule Replanner**: Triggers when blockers are recurring
- **Punishment Skill**: Triggers when commitments are missed

## Notification Logic

```
Default: Check-in reminder at user's preferred time

If missed by 1 hour:
  → "Hey, don't forget your check-in! 📝"

If missed by 3 hours:
  → "Still time for a quick check-in before bed."

If missed entirely:
  → Mark as missed, ask about it tomorrow
  → "I noticed you didn't check in yesterday. Everything okay?"
```

## UI Components

1. **Mood Selector**: 5 emoji options with haptic feedback
2. **Quick Input**: Text field for wins/blockers
3. **Commitment Card**: Tomorrow's focus displayed prominently
4. **Streak Badge**: Visual indicator of current streak
5. **History View**: Calendar view of past check-ins
