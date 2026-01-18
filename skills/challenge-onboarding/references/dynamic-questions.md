# Dynamic Question Bank for Challenge Onboarding

Questions adapt based on challenge type, user responses, and commitment level.

## Core Questions (Always Asked)

### 1. Goal Identification
```
"What challenge do you want to take on?"
```

### 2. Specific Outcome
```
"What specifically do you want to achieve? Paint me a picture of success."
```

### 3. Experience Level
```
"Have you attempted something like this before? What happened?"
```

### 4. Commitment Score
```
"On a scale of 1-10, how committed are you to completing this?"
```

### 5. Stakes
```
"What happens if you miss a day? What's your punishment?"
```

## Conditional Questions

### If Commitment Score < 8

**Dig deeper:**
```
"A [score]. What's stopping you from being a 9 or 10?"
"What would need to be different for you to be fully committed?"
"Is this actually the right goal for right now?"
"Should we scope this down to something more realistic?"
```

**Resolve concerns:**
```
"You mentioned [concern]. Let's solve that right now."
"What if we adjusted the plan to address [concern]?"
```

### If User Has Failed Before

```
"You tried this before. What specifically caused you to stop?"
"What will be different this time?"
"What systems can we put in place to prevent that?"
"Do you want a tougher accountability structure?"
```

### If Time Is Limited

```
"Walk me through your typical day, hour by hour."
"Where's the dead time you're not using?"
"What if we started with just 15-20 minutes?"
"What could you sacrifice temporarily for this goal?"
"Could you wake up 30 minutes earlier?"
```

### If Goal Is Vague

```
"Let's get specific. What does 'done' look like?"
"In 30 days, what's the minimum you'd need to accomplish?"
"Can you give me a concrete deliverable?"
"How will you measure success?"
```

## Type-Specific Questions

### Learning Challenges

**Goal clarification:**
```
"What's the end goal of learning this?
 - Career change
 - Current job improvement
 - Personal project
 - Pure curiosity"

"Is there a deadline? (exam, job application, etc.)"
```

**Style questions:**
```
"How do you learn best?
 - Video tutorials
 - Reading documentation
 - Building projects
 - Structured courses"

"Do you have any resources already, or should I suggest some?"
```

**Depth questions:**
```
"Do you want to go deep on fundamentals or broad on concepts?"
"What level do you want to reach? (beginner, intermediate, advanced)"
```

### Fitness Challenges

**Assessment:**
```
"What's your current fitness level honestly?"
"Any injuries or limitations I should know about?"
"Do you have gym access or are we doing home workouts?"
```

**Preference:**
```
"What time of day do you prefer to workout?"
"Do you like variety or a consistent routine?"
"Solo workouts or would you do group classes?"
```

**History:**
```
"What's your workout history like?"
"What caused you to fall off last time?"
"What types of exercise do you actually enjoy?"
```

### Building/Project Challenges

**Scope:**
```
"What's the absolute minimum viable version?"
"What features can wait for v2?"
"Solo or with a team?"
```

**Timeline:**
```
"Is there a launch deadline?"
"Who's waiting for this to be done?"
"What happens if you don't finish?"
```

**Blockers:**
```
"What technical challenges do you anticipate?"
"What skills might you need to learn along the way?"
"What's the biggest risk to completing this?"
```

### Habit Challenges

**Behavior design:**
```
"What's the specific behavior you want to do daily?"
"What's the trigger that will remind you? (After I ___)"
"Where will this habit happen?"
"How long does it take?"
```

**History:**
```
"Have you tried building this habit before?"
"What made you stop last time?"
"What's different now?"
```

**Motivation:**
```
"Why does this habit matter to you?"
"What will your life look like with this habit locked in?"
"What's the cost of NOT building this habit?"
```

### Creative Challenges

**Output:**
```
"What are you creating? Be specific."
"Will you publish or share your work?"
"Quantity or quality focus?"
```

**Process:**
```
"Do you have an existing creative routine?"
"Where will you do this work?"
"What tools/materials do you need?"
```

**Perfectionism check:**
```
"On a scale of 1-10, how much of a perfectionist are you?"
"Can you commit to shipping imperfect work?"
"What's your relationship with creative blocks?"
```

## Question Selection Algorithm

```python
def select_questions(challenge_type, user_responses):
    questions = []

    # Always start with core questions
    questions.append(CORE_QUESTIONS["goal_identification"])
    questions.append(CORE_QUESTIONS["specific_outcome"])

    # Add type-specific questions
    questions.extend(TYPE_QUESTIONS[challenge_type][:2])

    # Add commitment score
    questions.append(CORE_QUESTIONS["commitment_score"])

    # If commitment < 8, dig deeper
    if user_responses.get("commitment_score", 10) < 8:
        questions.extend(CONDITIONAL["low_commitment"][:2])

    # Check for red flags in responses
    if "tried before" in user_responses or "failed" in user_responses:
        questions.append(CONDITIONAL["failed_before"][0])

    if "no time" in user_responses or "busy" in user_responses:
        questions.extend(CONDITIONAL["time_limited"][:2])

    # Always end with stakes
    questions.append(CORE_QUESTIONS["stakes"])

    return questions[:8]  # Max 8 questions
```

## Response Processing

### Keywords to Detect

| Keyword | Action |
|---------|--------|
| "no time", "busy" | Trigger time deep-dive |
| "tried before", "failed" | Trigger failure analysis |
| "not sure", "maybe" | Trigger commitment dig |
| "I want to" (vague) | Trigger specificity questions |
| Commitment < 8 | Must resolve before continuing |

### Sentiment Signals

| Signal | Response Adjustment |
|--------|---------------------|
| Enthusiastic | Move faster, less hand-holding |
| Hesitant | More validation, smaller steps |
| Skeptical | Focus on quick wins |
| Overwhelmed | Reduce scope immediately |

## Question Phrasing Guidelines

### DO:
- "What..." (open-ended)
- "Walk me through..." (detailed)
- "On a scale of..." (quantifiable)
- "What would need to..." (solution-focused)

### DON'T:
- "Do you..." (yes/no)
- "Are you..." (yes/no)
- "Why didn't you..." (blame-focused)
- "You should..." (prescriptive before understanding)
