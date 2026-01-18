# OpenAnalyst Schedule Replanner

Intelligent schedule adjustment that protects goals while accommodating real life.

## Purpose

Life happens. This skill:
1. Allows legitimate schedule changes without breaking streaks
2. Prevents abuse of rescheduling (not a free pass)
3. Redistributes missed work across remaining days
4. Tracks patterns to identify systemic issues
5. Distinguishes emergencies from excuses

## Philosophy

**Flexibility with Accountability**
- Yes, you can reschedule
- But it costs something (explanation, redistribution)
- Repeated reschedules trigger deeper conversation
- The goal doesn't change, only the timeline

## Replan Flow

### Standard Replan Request

```
User: "I need to reschedule today's session"

Coach: "No problem. What's going on?"

User: "Unexpected work meeting until 10pm"

Coach: "Work happens. Here's what I need from you:

       1. When will you make up today's work?
       2. Is this a one-time thing or should we adjust your schedule?

       You have 2 free replans this week. This uses 1."

User: "I'll do it tomorrow morning before work"

Coach: "Locked in. Tomorrow you'll do:
       - Today's planned session (morning)
       - Tomorrow's planned session (evening)

       Your streak stays intact as long as you deliver tomorrow.
       I'll check in at 8am. Deal?"
```

### Emergency Replan

```
User: "Family emergency, can't do anything this week"

Coach: "I'm sorry to hear that. Family comes first, always.

       I'm pausing your challenge for 7 days. Your streak will freeze,
       not reset. When you're ready to resume, just say the word.

       Take care of what matters. I'll be here."
```

### Suspicious Pattern Detected

```
Coach: "Hey, I noticed this is your 4th replan in 2 weeks. Let's talk.

       Looking at the pattern:
       - Dec 20: 'Work meeting' → rescheduled to next day
       - Dec 23: 'Feeling tired' → rescheduled to weekend
       - Dec 26: 'Social plans' → rescheduled to morning
       - Today: 'Work meeting' again

       I'm not judging, but I am noticing. What's really going on?

       Options:
       A) The schedule is too aggressive - let's reduce daily commitment
       B) Something else is going on - let's talk about it
       C) I need to be tougher with you - no more replans this week"
```

## Replan Rules

### Free Replans
- 2 per week by default
- Rollover NOT allowed
- Emergency pause doesn't count against limit

### Replan Costs
| Type | Cost |
|------|------|
| Same-day swap | Free (if done before scheduled time) |
| Next-day makeup | Free |
| Push to weekend | 1 replan |
| Skip entirely | Streak impact + punishment trigger |

### Streak Protection
- Replan ≠ Skip
- Work must be redistributed, not deleted
- If makeup is completed → streak continues
- If makeup is missed → counts as missed day

## Data Storage

### ~/.openanalyst/schedule/replans.json
```json
{
  "week_start": "2025-12-23",
  "replans_used": 1,
  "replans_remaining": 1,
  "history": [
    {
      "date": "2025-12-26",
      "reason": "Work meeting until 10pm",
      "original_plan": "Python lesson 15",
      "rescheduled_to": "2025-12-27 morning",
      "makeup_completed": false
    }
  ]
}
```

### ~/.openanalyst/schedule/patterns.md
```markdown
# Schedule Patterns

## Replan Frequency
- This week: 1/2
- Last week: 2/2
- Month total: 5

## Common Reasons
1. Work meetings (40%)
2. Social plans (30%)
3. Fatigue (20%)
4. Other (10%)

## Peak Replan Days
- Friday (most common)
- Monday (second)

## Coach Analysis
User may be overcommitting on Fridays. Suggest reducing
Friday targets or moving to weekend.
```

## Smart Redistribution

When user replans, the system automatically suggests how to redistribute:

```
Original Week Plan:
- Mon: 1 hour Python
- Tue: 1 hour Python
- Wed: 1 hour Python (REPLANNED)
- Thu: 1 hour Python
- Fri: 1 hour Python

After Wednesday Replan:
Option A - Spread Evenly:
- Thu: 1.5 hours Python
- Fri: 1.5 hours Python

Option B - Weekend Catch-up:
- Thu: 1 hour Python
- Fri: 1 hour Python
- Sat: 1 hour Python (makeup)

Option C - Intensive Day:
- Thu: 2 hours Python
- Fri: 1 hour Python
```

## Integration Points

- **Streak Skill**: Protects streak during legitimate replans
- **Punishment Skill**: Triggers if replan limits exceeded
- **Daily Check-in**: Asks about makeup completion
- **Motivation Generator**: Encourages after replan completion

## Anti-Abuse Measures

1. **Justification Required**: Must give reason
2. **Pattern Detection**: Flags repeated excuses
3. **Escalating Friction**: More questions after multiple replans
4. **Punishment Integration**: Skip triggers consequences
5. **Weekly Limit**: Can't infinitely postpone

## UI Components

1. **Replan Button**: Quick access with remaining count
2. **Redistribution Picker**: Visual week view with drag-drop
3. **Makeup Tracker**: Shows pending makeup sessions
4. **Pattern Dashboard**: Weekly/monthly replan visualization
