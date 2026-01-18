# Onboarding Question Bank

Dynamic questions the coach can ask during onboarding. Questions are selected based on previous answers.

## Core Questions (Always Asked)

### Identity
1. "What should I call you?"
2. "What's your timezone?"

### Schedule
3. "When are you most productive - morning, afternoon, or evening?"
4. "How many hours per day can you dedicate to personal growth?"

### Motivation
5. "What keeps you going when working toward a goal?"
6. "When you fall off track, what helps you get back on?"

### Goals
7. "What's your biggest goal right now?"

## Conditional Questions

### If User Says "Busy"
- "Walk me through a typical weekday - where are the pockets of time?"
- "Are weekends more flexible for you?"
- "Would you prefer fewer but longer sessions, or quick daily habits?"

### If User Says "Beginner"
- "Have you tried any productivity systems before?"
- "What's held you back from achieving goals in the past?"
- "Do you prefer structured guidance or flexibility?"

### If User Mentions Specific Domain

#### Learning Goals
- "What's your learning style - videos, reading, or hands-on?"
- "Do you have a deadline for this learning goal?"
- "Are you learning for work, career change, or personal interest?"

#### Fitness Goals
- "Do you currently have any exercise routine?"
- "Any injuries or limitations I should know about?"
- "Do you prefer working out alone or with others?"

#### Building/Project Goals
- "Is this a solo project or with a team?"
- "Do you have a launch date in mind?"
- "What's the minimum viable version look like?"

#### Habit Goals
- "Have you tried building this habit before?"
- "What triggered the failure last time?"
- "Is there an existing routine I can attach this to?"

### Accountability Style Deep-Dive

#### If "Tough Love"
- "How tough? Scale of 1-10, where 10 is drill sergeant?"
- "Should I call you out publicly or privately?"
- "What's the consequence when you miss a commitment?"

#### If "Gentle"
- "Do you want encouragement even when things are going well?"
- "How should I phrase it when you're falling behind?"
- "Do you need more flexibility built into your goals?"

### Time Management

#### If Limited Time
- "What's non-negotiable in your schedule?"
- "Would you sacrifice sleep for your goals? (Be honest)"
- "Can any current activities be reduced or eliminated?"

#### If Flexible Schedule
- "Does too much flexibility make you procrastinate?"
- "Would you benefit from artificial deadlines?"
- "Should I schedule specific time blocks for you?"

## Question Selection Algorithm

```
1. Ask all Core Questions (7 questions)
2. Based on answers, select 2-3 Conditional Questions
3. Total: 8-10 questions max
4. If user seems rushed, skip to essentials
5. If user is engaged, explore deeper
```

## Answer Processing

### Keywords to Detect

| Keyword | Triggers |
|---------|----------|
| "busy", "no time" | Time management deep-dive |
| "beginner", "new to" | Learning style questions |
| "failed before" | Accountability style focus |
| "morning person" | Schedule optimization |
| "night owl" | Evening-focused planning |
| "procrastinate" | Structure vs flexibility questions |

### Sentiment Detection
- Enthusiastic → Move faster, less hand-holding
- Hesitant → More encouragement, explain benefits
- Skeptical → Prove value quickly, concrete examples
- Overwhelmed → Simplify, reduce scope

## Closing Variations

### For Ambitious Users
"You've got big goals and I'm here for it. Let's make them happen. Ready to start?"

### For Cautious Users
"We'll take this one step at a time. Small wins lead to big results. Ready when you are."

### For Skeptical Users
"Actions speak louder than words. Let me prove my value. Give me one week."

### For Overwhelmed Users
"Deep breath. We're going to break everything into tiny, manageable pieces. You've got this."
