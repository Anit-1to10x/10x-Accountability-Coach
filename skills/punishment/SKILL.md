# OpenAnalyst Commitment Contracts (Punishment System)

## Core Psychology

**Loss Aversion**: People are 2-3x more motivated by losing something than gaining something.

**Research shows**: Users who put financial stakes on commitments are **3x more likely to succeed**.

## How It Works

### 1. Contract Creation (During Challenge Onboarding)

```
Coach: "Now let's add some real stakes. What happens if you miss a day?"

User: "I'll send $100 to my girlfriend"

Coach: "Perfect. Let me confirm:

       📜 COMMITMENT CONTRACT
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       Challenge: Learn Python in 30 Days
       Commitment: Daily 1-hour session

       PUNISHMENT TERMS:
       • Trigger: Missing a scheduled session
       • Consequence: Send $100 to girlfriend
       • Recipient: [Girlfriend's name/contact]
       • Grace Period: 24 hours to make up

       REFEREE:
       • Name: [Girlfriend's name]
       • Role: Confirms punishment was received

       Do you agree to these terms?"

User: "Yes"

Coach: "Contract signed. I've notified your referee.
       She'll receive updates on your progress and confirm
       if punishment is needed.

       Day 1 starts now. Make us proud. 💪"
```

### 2. Daily Tracking

Claude (the brain) automatically tracks:
- Did user check in today?
- Did user complete their commitment?
- Is this within grace period?
- Should punishment trigger?

### 3. Punishment Trigger

```
[User missed Day 5, no check-in, grace period expired]

Coach: "Alex, we need to talk.

       Yesterday you missed your Python session.
       I waited 24 hours for a makeup or explanation.
       Nothing.

       According to your commitment contract:
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ❌ Day 5: MISSED
       💸 Punishment: Send $100 to [Girlfriend]
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

       I've already notified [Girlfriend] that the
       punishment is due. She's been sent the contract
       you signed.

       Your move:
       A) Send the $100 now and confirm
       B) [Girlfriend] confirms she received it
       C) Appeal (requires valid emergency proof)

       Your streak: RESET to 0
       Next session: Today 8pm

       This isn't punishment for punishment's sake.
       It's the cost of breaking your word.
       Ready to restart?"
```

## Punishment Types

### 1. Financial Punishments
```markdown
- Send money to friend/family
- Donate to charity
- Donate to ANTI-charity (cause you hate)
- Pay into savings (forced saving)
```

### 2. Social Punishments
```markdown
- Referee gets notified of failure
- Public post on social media
- Tell X people about the miss
- Embarrassing task
```

### 3. Forfeit Punishments
```markdown
- Lose a privilege (no Netflix for a week)
- Give away something (video game time)
- Skip something fun (Friday drinks)
```

### 4. Escalating Stakes
```markdown
First miss: $20
Second miss: $50
Third miss: $100
Fourth miss: $200 + public confession
```

## Contract Storage

### ~/.openanalyst/contracts/active-contract.json
```json
{
  "contract_id": "ctr_abc123",
  "challenge_id": "learn-python-30",
  "created_at": "2025-12-26T10:00:00Z",
  "signed_at": "2025-12-26T10:05:00Z",

  "commitment": {
    "description": "Complete 1 hour of Python daily",
    "frequency": "daily",
    "start_date": "2025-12-26",
    "end_date": "2026-01-25"
  },

  "punishment": {
    "type": "financial",
    "amount": 100,
    "currency": "USD",
    "recipient": {
      "name": "Sarah",
      "relationship": "girlfriend",
      "contact": "sarah@email.com"
    },
    "method": "venmo"
  },

  "referee": {
    "name": "Sarah",
    "email": "sarah@email.com",
    "notified": true
  },

  "escalation": {
    "enabled": true,
    "levels": [
      {"miss_count": 1, "amount": 100},
      {"miss_count": 2, "amount": 150},
      {"miss_count": 3, "amount": 200}
    ]
  },

  "grace_period_hours": 24,

  "history": []
}
```

### ~/.openanalyst/contracts/punishment-history.md
```markdown
# Punishment History

## Active Contract: Learn Python in 30 Days

### Miss #1 - December 30, 2025
- **Trigger:** Missed Day 5, no makeup within 24 hours
- **Punishment:** $100 to Sarah
- **Status:** ✅ Paid and confirmed by referee
- **User Note:** "I accept. Won't happen again."

### Appeals
None filed.

## Statistics
- Total Misses: 1
- Total Paid: $100
- Punishment Success Rate: 100%
```

## Referee System

### Referee Role
1. Gets notified when contract is signed
2. Receives progress updates (weekly)
3. Gets alerted when punishment triggers
4. Confirms punishment was received
5. Can verify legitimate emergencies

### Referee Notifications

**On Contract Sign:**
```
Subject: You're Alex's Accountability Referee

Hi Sarah,

Alex has committed to learning Python for 30 days and
chosen you as their referee. Here's what that means:

CONTRACT DETAILS:
- Challenge: Learn Python in 30 Days
- Daily commitment: 1 hour of study
- If missed: Alex sends you $100

YOUR ROLE:
- You'll get weekly progress updates
- If Alex misses, you'll be notified
- Confirm when punishment is received

Alex is trusting you to hold them accountable.
No letting them off easy! 😄

View contract: [link]
```

**On Punishment Trigger:**
```
Subject: 🚨 Alex missed their commitment

Hi Sarah,

Alex missed their Python session yesterday.
Per their commitment contract, they owe you $100.

DETAILS:
- Missed: December 30, 2025
- Commitment: 1 hour Python study
- Punishment: $100 to you

Please confirm when you receive the payment.

[Confirm Payment Received] [Alex Appealed - Review]
```

## Anti-Charity Option

For extra motivation, users can donate to causes they oppose:

```
Coach: "Want to make the stakes even higher?
       Instead of sending money to someone you like,
       you can set it to donate to an anti-charity -
       a cause or organization you really don't support.

       For example:
       - Political party you oppose
       - Rival sports team's charity
       - Organization with values you disagree with

       Studies show this is VERY effective motivation.
       Interested?"
```

## Integration Points

- **Claude Brain**: Monitors all check-ins, triggers punishments
- **Streak Skill**: Resets streak on missed day
- **Daily Check-in**: Warns when approaching deadline
- **Schedule Replanner**: Legitimate replans avoid punishment
- **Motivation Generator**: Extra motivation when stakes are high

## Appeal System

Users can appeal with valid emergencies:

```
User: "I need to appeal yesterday's miss"

Coach: "Tell me what happened."

User: "I was in the hospital with food poisoning"

Coach: "That's a valid emergency. Can you provide any proof?
       - Hospital discharge papers
       - Doctor's note
       - Photo evidence

       If verified, I'll void this punishment and pause
       your challenge for recovery."
```

## Safety Features

1. **24-hour grace period** - Always a chance to make up
2. **Appeal system** - Legitimate emergencies respected
3. **Max punishment cap** - Won't bankrupt anyone
4. **Referee verification** - Human check on the system
5. **Pause option** - Extended breaks don't trigger

## Sources

This system is inspired by research and apps that have proven this approach works:

- [StickK](https://www.stickk.com/) - Yale economists' commitment contract platform
- [Beeminder](https://www.beeminder.com/) - Data-driven accountability with money stakes
- [ActionBuddy](https://actionbuddy.io/blog/accountability-apps) - Human accountability partnerships
