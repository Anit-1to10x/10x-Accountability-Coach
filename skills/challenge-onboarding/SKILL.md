# OpenAnalyst Challenge Onboarding

Dynamic, AI-driven onboarding flow when user creates a new challenge. Questions adapt based on challenge type and user responses.

Based on best practices from [The Coaching Tools Company](https://www.thecoachingtoolscompany.com/25-powerful-questions-to-ensure-clients-complete-actions/) and [GoalsWon](https://www.goalswon.com/).

## Purpose

When user clicks "Create Challenge", this skill:
1. Asks ~5 dynamic questions like a real accountability coach
2. Adapts questions based on challenge type and answers
3. Calculates commitment score (must be ≥8/10)
4. Translates vague goals into specific daily actions
5. Creates schedule based on user's availability
6. Sets up punishment contract
7. Generates initial todos and milestones

## Onboarding Flow

### Phase 1: Challenge Identification

```
Coach: "What challenge do you want to take on?"

User: "Learn Python"

Coach: "Love it! Let me understand more.
       What specifically do you want to achieve with Python?

       For example:
       - Get a job as a developer
       - Automate boring tasks at work
       - Build a personal project
       - Just curious to learn"

User: "I want to get into data science"

Coach: "Data science with Python - great goal!
       Have you done any programming before?"

User: "I know a little JavaScript"

Coach: "Perfect, so not starting from zero. That helps.
       Let me ask you something important..."
```

### Phase 2: The Commitment Score

```
Coach: "On a scale of 1-10, how committed are you to actually
       completing this challenge? Be honest - no judgment."

User: "7"

Coach: "A 7. Okay, what's holding you back from being a 9 or 10?"

User: "I'm worried I won't have enough time with my job"

Coach: "That's a real concern. Let's solve it right now.

       Walk me through your typical weekday. When do you wake up,
       when do you work, when are you free?"

User: "Wake up 7am, work 9-6, usually free after 8pm"

Coach: "So 8pm to whenever you sleep - that's your window.
       How many hours can you realistically commit daily?"

User: "1 hour, maybe 1.5"

Coach: "1 hour is perfect. That's 7 hours per week.
       Enough to make real progress.

       Now that we've addressed the time concern,
       what's your commitment level?"

User: "9"

Coach: "That's what I like to hear. Let's build this plan."
```

### Phase 3: Goal Clarification

```
Coach: "Let's get specific. In 30 days, what's the minimum
       you'd need to accomplish to feel successful?"

User: "Understand the basics and maybe do a small project"

Coach: "Let me translate that into concrete milestones:

       WEEK 1: Python fundamentals (variables, loops, functions)
       WEEK 2: Data structures + libraries (NumPy, Pandas)
       WEEK 3: Data visualization (Matplotlib, basic analysis)
       WEEK 4: Mini-project (analyze a real dataset)

       Does that sound right?"

User: "Yes, perfect"
```

### Phase 4: Schedule Creation

```
Coach: "Based on your availability:

       YOUR SCHEDULE:
       ━━━━━━━━━━━━━━━━━━━━━━━━━
       Mon: 8:00 PM - 9:00 PM
       Tue: 8:00 PM - 9:00 PM
       Wed: 8:00 PM - 9:00 PM
       Thu: 8:00 PM - 9:00 PM
       Fri: 8:00 PM - 9:00 PM
       Sat: Flexible (catch-up if needed)
       Sun: 8:00 PM - 9:00 PM (week review)

       This gives you:
       - 6-7 hours/week of learning
       - Saturday buffer for life
       - Sunday for review and planning

       Any adjustments needed?"

User: "Can we skip Friday? I usually have plans"

Coach: "Done. Friday is now your rest day.
       Saturday becomes your make-up day if needed."
```

### Phase 5: Punishment Contract

```
Coach: "Last step. What happens when you miss a day?

       Studies show that having real stakes makes you
       3x more likely to succeed. What's your punishment?"

User: "I'll send $50 to my brother"

Coach: "Good. And who's your referee? Someone who will
       actually hold you accountable."

User: "My brother"

Coach: "Perfect - he's both the recipient and referee.
       He'll get notified when you miss.

       📜 YOUR COMMITMENT CONTRACT:
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       Challenge: Learn Python for Data Science
       Duration: 30 days
       Daily: 1 hour (Mon-Thu, Sat-Sun)
       Rest: Friday

       If I miss: $50 to [Brother]
       Referee: [Brother]
       Grace period: 24 hours

       Type 'I AGREE' to sign this contract."

User: "I AGREE"

Coach: "Contract signed. Your brother has been notified.

       Day 1 starts NOW. Your first session is at 8pm tonight.
       I'll check in with you then.

       Let's do this! 🚀"
```

## Dynamic Question Logic

### By Challenge Type

#### Learning Challenges
1. What do you want to learn?
2. What's the end goal? (job, project, curiosity)
3. Current experience level?
4. Preferred learning style? (videos, reading, projects)
5. Any deadlines? (exam, job application)

#### Fitness Challenges
1. What's the fitness goal?
2. Current fitness level?
3. Any injuries/limitations?
4. Preferred workout times?
5. Equipment available?

#### Building Challenges
1. What are you building?
2. Solo or team?
3. Target launch date?
4. What's MVP look like?
5. Tech stack preferences?

#### Habit Challenges
1. What habit do you want to build?
2. Tried this before? What happened?
3. What triggers will remind you?
4. How will you track it?
5. What's the cue-routine-reward?

#### Creative Challenges
1. What are you creating?
2. What does "done" look like?
3. Will you publish/share?
4. Quantity vs quality focus?
5. Any existing creative routine?

### Commitment Score Deep-Dive

If score < 8, ask:
- "What's holding you back from [current+2]?"
- "What would need to change for you to be more committed?"
- "Is this actually the right goal for you right now?"
- "Should we reduce the scope to something more achievable?"

### Availability Conflict Resolution

If user says "no time":
- "Walk me through a typical day, hour by hour"
- "What if we started with just 15 minutes?"
- "Could you wake up 30 minutes earlier?"
- "What could you cut to make room for this?"

## Output Files

### ~/.openanalyst/challenges/[slug]/challenge-config.json
```json
{
  "id": "learn-python-data-science",
  "name": "Learn Python for Data Science",
  "type": "learning",
  "created_at": "2025-12-26T15:00:00Z",
  "start_date": "2025-12-26",
  "end_date": "2026-01-25",
  "duration_days": 30,

  "commitment": {
    "daily_hours": 1,
    "weekly_hours": 6,
    "active_days": ["mon", "tue", "wed", "thu", "sat", "sun"],
    "rest_days": ["fri"],
    "session_time": "20:00"
  },

  "goals": {
    "primary": "Understand Python basics and complete a data science project",
    "milestones": [
      {"week": 1, "goal": "Python fundamentals"},
      {"week": 2, "goal": "NumPy and Pandas"},
      {"week": 3, "goal": "Data visualization"},
      {"week": 4, "goal": "Mini-project completion"}
    ]
  },

  "commitment_score": 9,
  "user_concerns": ["time management with job"],
  "solutions_discussed": ["8pm-9pm window", "Saturday buffer"]
}
```

### ~/.openanalyst/challenges/[slug]/schedule.md
```markdown
# Weekly Schedule: Learn Python

## Regular Schedule
| Day | Time | Activity |
|-----|------|----------|
| Mon | 8-9 PM | Lesson + practice |
| Tue | 8-9 PM | Lesson + practice |
| Wed | 8-9 PM | Lesson + practice |
| Thu | 8-9 PM | Lesson + practice |
| Fri | - | REST DAY |
| Sat | Flexible | Catch-up/extra practice |
| Sun | 8-9 PM | Week review + next week prep |

## Session Structure (1 hour)
- 0-10 min: Review yesterday
- 10-45 min: New material
- 45-55 min: Practice exercises
- 55-60 min: Log check-in

## Check-in Time
Daily reminder: 9:00 PM
```

### ~/.openanalyst/challenges/[slug]/milestones.md
```markdown
# Milestones: Learn Python

## Week 1: Foundations
- [ ] Variables and data types
- [ ] Conditionals (if/else)
- [ ] Loops (for/while)
- [ ] Functions
- [ ] Mini-exercise: Calculator program

## Week 2: Data Structures
- [ ] Lists and tuples
- [ ] Dictionaries
- [ ] NumPy basics
- [ ] Pandas DataFrames
- [ ] Mini-exercise: Data manipulation

## Week 3: Visualization
- [ ] Matplotlib basics
- [ ] Creating charts
- [ ] Pandas plotting
- [ ] Analyzing a sample dataset
- [ ] Mini-exercise: Visualize data

## Week 4: Project
- [ ] Choose dataset
- [ ] Data cleaning
- [ ] Analysis
- [ ] Visualization
- [ ] Present findings
```

## Integration Points

- **User Onboarding**: Pulls availability and preferences
- **Punishment Skill**: Creates commitment contract
- **Streak Skill**: Initializes challenge tracking
- **Schedule Replanner**: Uses schedule data
- **Daily Check-in**: Uses session times
- **Motivation**: Uses goals for personalized motivation

## UI Components

1. **Chat Interface**: Full-screen conversational onboarding
2. **Commitment Score Slider**: Visual 1-10 scale
3. **Schedule Builder**: Interactive weekly calendar
4. **Contract Preview**: Formal-looking contract card
5. **Confirmation Screen**: Summary before starting
