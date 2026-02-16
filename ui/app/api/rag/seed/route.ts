/**
 * RAG Seed API - Inserts sample blog documents into Supabase
 * POST /api/rag/seed
 */

import { NextResponse } from 'next/server';
import { ragService } from '@/lib/rag';

// Sample blog documents for RAG testing
const sampleBlogs = [
  {
    title: 'The Power of Daily Accountability: Transform Your Productivity',
    content: `Accountability is the secret weapon of high performers. When you commit to being accountable, whether to yourself, a coach, or a community, you tap into a powerful psychological mechanism that drives consistent action.

**Why Accountability Works**

Research shows that people who share their goals with someone else are 65% more likely to achieve them. When you add regular check-ins with an accountability partner, that number jumps to 95%.

**The Psychology Behind It**

1. **Social Commitment**: When we make a promise to others, our brain treats it differently than promises to ourselves. Breaking a commitment to someone else feels more consequential.

2. **Loss Aversion**: We're more motivated to avoid disappointing others than to achieve for ourselves. Accountability leverages this natural tendency.

3. **Feedback Loops**: Regular check-ins create feedback loops that help you course-correct quickly rather than drifting off track for weeks.

**How to Build Effective Accountability**

- **Daily Check-ins**: Brief daily updates keep you connected to your goals
- **Weekly Reviews**: Deeper analysis of what worked and what didn't
- **Monthly Reflections**: Big-picture assessment of progress toward larger goals
- **Public Commitments**: Sharing goals publicly increases follow-through

**The 10X Accountability Method**

Our approach combines AI-powered coaching with proven accountability frameworks. By checking in daily with your AI coach, you maintain consistency while getting personalized insights about your patterns and progress.

Remember: Accountability isn't about punishment for failure. It's about creating supportive structures that make success the path of least resistance.`,
    summary: 'Discover how daily accountability can increase your goal achievement rate from 10% to 95%. Learn the psychology behind accountability and practical strategies to implement it.',
    category: 'accountability' as const,
    tags: ['accountability', 'productivity', 'goals', 'habits', 'psychology'],
    source: 'blog',
    author: '10X Accountability Coach',
    metadata: { readTime: 5, featured: true },
  },
  {
    title: '5 Morning Habits of Highly Productive People',
    content: `Your morning sets the tone for your entire day. The most productive people in the world understand this and have crafted intentional morning routines that prime them for success.

**Habit 1: Wake Up Early (But Get Enough Sleep)**

Successful people don't sacrifice sleep for early mornings. They go to bed earlier. The magic isn't in waking at 5 AM—it's in having quiet, uninterrupted time before the world demands your attention.

**Habit 2: Avoid Your Phone for the First Hour**

Checking email or social media first thing hijacks your attention and puts you in reactive mode. The most productive people protect their morning mental space.

**Habit 3: Move Your Body**

Whether it's a full workout, yoga, or a 10-minute walk, physical movement:
- Increases blood flow to the brain
- Releases endorphins
- Boosts energy for hours
- Improves decision-making

**Habit 4: Review Goals and Priorities**

Before diving into tasks, successful people spend 5-10 minutes reviewing their goals. This ensures daily actions align with larger objectives.

**Habit 5: Tackle the Hardest Task First**

Mark Twain called this "eating the frog." By completing your most challenging task when willpower is highest, you build momentum and eliminate the anxiety of avoidance.

**Building Your Morning Routine**

Start small. Pick one habit and practice it for two weeks before adding another. Consistency beats intensity. A modest routine you do daily beats an elaborate one you abandon.

**The Compound Effect**

Small morning improvements compound over time. A 1% better morning, repeated daily, leads to a 37x improvement over a year. That's the power of consistent morning habits.`,
    summary: 'Learn the 5 morning habits that separate high performers from the rest. From managing your phone to eating the frog, these practices will transform your productivity.',
    category: 'habits' as const,
    tags: ['habits', 'morning-routine', 'productivity', 'success', 'discipline'],
    source: 'blog',
    author: '10X Accountability Coach',
    metadata: { readTime: 6, featured: true },
  },
  {
    title: 'Goal Setting That Actually Works: The SMART Framework Enhanced',
    content: `Most people set goals wrong. They're either too vague ("get healthier") or too ambitious without a plan ("become a millionaire"). The SMART framework provides structure, but it needs enhancement for today's fast-paced world.

**Traditional SMART Goals**

- **S**pecific: Clear and well-defined
- **M**easurable: Quantifiable progress
- **A**chievable: Realistic yet challenging
- **R**elevant: Aligned with your values
- **T**ime-bound: Has a deadline

**The Enhanced SMART+ Framework**

We add three crucial elements:

**E**motional: Connect to deep emotional drivers. WHY does this goal matter? What will achieving it FEEL like? Emotional connection fuels persistence.

**S**ystems: Goals are outcomes. Systems are the daily behaviors that produce outcomes. Focus 80% on systems, 20% on goals.

**R**eview: Built-in review points. Weekly check-ins prevent drift and allow course correction.

**Example Transformation**

❌ Vague: "I want to be more productive"

✅ SMART+: "I will complete my 3 Most Important Tasks before noon, Monday through Friday, for the next 90 days. This matters because I want to advance my career and feel proud of my work. I'll track completion in my daily check-in and review progress every Sunday."

**The 90-Day Goal Cycle**

Annual goals are too distant. Monthly goals don't allow for meaningful progress. 90 days is the sweet spot—long enough for significant achievement, short enough to maintain urgency.

**Implementation Steps**

1. Define 1-3 goals for the next 90 days
2. Identify the daily/weekly systems that support each goal
3. Set up accountability check-ins
4. Review and adjust weekly
5. Celebrate progress, not just completion`,
    summary: 'The traditional SMART goal framework gets an upgrade. Learn about SMART+ goals with emotional connection, systems thinking, and built-in review cycles for better results.',
    category: 'goal-setting' as const,
    tags: ['goals', 'goal-setting', 'planning', 'productivity', 'success'],
    source: 'blog',
    author: '10X Accountability Coach',
    metadata: { readTime: 7, featured: false },
  },
  {
    title: 'Overcoming Procrastination: A Practical Guide',
    content: `Procrastination isn't laziness—it's an emotional regulation problem. Understanding this changes everything about how we combat it.

**The Real Cause of Procrastination**

We don't procrastinate because we're lazy or undisciplined. We procrastinate because:
- The task triggers negative emotions (anxiety, boredom, frustration)
- Our brain seeks immediate mood repair
- We choose short-term comfort over long-term benefit

**The Procrastination Cycle**

1. Task triggers discomfort
2. Brain seeks escape
3. We distract ourselves
4. Temporary relief
5. Task remains, plus guilt
6. More discomfort, more avoidance

**Breaking the Cycle**

**1. Identify the Emotion**
Before you can address procrastination, name the feeling. Is it:
- Fear of failure?
- Perfectionism anxiety?
- Boredom?
- Overwhelm?

**2. The 2-Minute Rule**
If something takes less than 2 minutes, do it now. For larger tasks, commit to just 2 minutes. Starting is often the hardest part.

**3. Implementation Intentions**
Instead of "I'll work on the project," specify: "At 9 AM, I will open my laptop, go to my project folder, and write for 25 minutes."

**4. Remove Friction**
Make starting easier:
- Prepare your workspace the night before
- Close unnecessary browser tabs
- Put your phone in another room

**5. Reward Progress**
After completing a work session, give yourself a small reward. This builds positive associations with the task.

**The Forgiveness Factor**

Self-criticism after procrastinating makes future procrastination more likely. Self-compassion—acknowledging the slip without judgment—reduces future procrastination.

**Your Anti-Procrastination Toolkit**

- Pomodoro Technique (25 min work, 5 min break)
- Body doubling (working alongside others)
- Daily accountability check-ins
- Task chunking (breaking big tasks into small steps)
- Energy management (matching tasks to energy levels)`,
    summary: 'Procrastination is an emotional regulation problem, not a character flaw. Learn the science behind why we procrastinate and practical techniques to overcome it.',
    category: 'productivity' as const,
    tags: ['procrastination', 'productivity', 'mindset', 'habits', 'focus'],
    source: 'blog',
    author: '10X Accountability Coach',
    metadata: { readTime: 8, featured: true },
  },
  {
    title: 'Building Unbreakable Motivation: Internal vs External Drivers',
    content: `Motivation is often misunderstood. We wait for motivation to strike, then act. But the most consistently productive people do the opposite: they act, and motivation follows.

**The Motivation Myth**

Motivation isn't a prerequisite for action—it's often a result of it. Waiting to "feel motivated" is a trap that keeps people stuck.

**Two Types of Motivation**

**External (Extrinsic) Motivation**
- Rewards, recognition, money
- Fear of punishment
- Social pressure
- External deadlines

**Internal (Intrinsic) Motivation**
- Personal growth and mastery
- Alignment with values
- Autonomy and self-direction
- Purpose and meaning

**Why Internal Motivation Wins**

External motivation works short-term but fades. Internal motivation sustains long-term effort because:
1. It doesn't depend on others
2. It's tied to identity, not just outcomes
3. It makes the process enjoyable, not just the result

**Building Internal Motivation**

**1. Connect to Your Why**
Not "I should exercise" but "I exercise because I want to be an active parent and live a long, healthy life."

**2. Find the Enjoyable Elements**
Every task has aspects you can enjoy if you look for them. Focus on those.

**3. Track Progress Visually**
Seeing progress is intrinsically motivating. Use streak counters, progress bars, or journals.

**4. Create Autonomy**
When possible, choose HOW you complete tasks. Autonomy increases intrinsic motivation.

**The Discipline-Motivation Dance**

Discipline gets you started on days motivation is low. But discipline alone is exhausting. The goal is to build enough intrinsic motivation that discipline is only needed occasionally, not constantly.

**The Action-Motivation Loop**

1. Take a small action (even without motivation)
2. Experience small progress
3. Feel slightly more motivated
4. Take another action
5. Build momentum

Don't wait for motivation. Create it through action.`,
    summary: 'Stop waiting for motivation and start creating it. Learn the difference between external and internal motivation and how to build unbreakable drive through action.',
    category: 'motivation' as const,
    tags: ['motivation', 'mindset', 'productivity', 'discipline', 'success'],
    source: 'blog',
    author: '10X Accountability Coach',
    metadata: { readTime: 6, featured: false },
  },
];

export async function POST() {
  try {
    // Check if RAG service is available
    if (!ragService.isAvailable()) {
      return NextResponse.json(
        { error: 'RAG service not available. Check Supabase configuration.' },
        { status: 503 }
      );
    }

    // Insert sample documents
    const insertedCount = await ragService.insertDocuments(sampleBlogs);

    if (insertedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to insert documents. Check if the rag_documents table exists.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${insertedCount} sample blog documents`,
      count: insertedCount,
    });
  } catch (error) {
    console.error('[RAG Seed] Error:', error);
    return NextResponse.json(
      { error: 'Failed to seed RAG documents', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return the sample blogs for preview
    return NextResponse.json({
      message: 'Sample blog documents available for seeding',
      count: sampleBlogs.length,
      blogs: sampleBlogs.map((b) => ({
        title: b.title,
        category: b.category,
        tags: b.tags,
        summary: b.summary,
      })),
      instructions: 'Send a POST request to this endpoint to insert the sample blogs into Supabase',
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
