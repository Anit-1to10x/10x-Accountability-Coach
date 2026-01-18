'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui'

type GuideSection = {
  id: string
  title: string
  icon: string
  content: React.ReactNode
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>('getting-started')

  const sections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Welcome to OpenAnalyst Accountability Coach</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Your personal AI-powered accountability system. Everything runs locally,
              and all your data is stored in the <code className="px-2 py-1 bg-oa-bg-secondary border border-oa-border">data/</code> folder.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Quick Start</h4>
            <ol className="text-sm text-oa-text-secondary space-y-2 list-decimal list-inside">
              <li>Run <code className="px-1 bg-oa-bg-secondary">npm start</code> to launch everything</li>
              <li>Open <code className="px-1 bg-oa-bg-secondary">http://localhost:3000</code></li>
              <li>Complete onboarding to create your profile</li>
              <li>Create your first challenge from the Streak section</li>
              <li>Check in daily to build your streak</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What Gets Started</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• Next.js UI at localhost:3000</li>
              <li>• WebSocket Server at localhost:8765</li>
              <li>• Fast Cache System (0-2ms queries)</li>
              <li>• AI Response Listener</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'claude-code',
      title: 'Claude Code',
      icon: '🤖',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Supercharge Your Experience with Claude Code</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Claude Code is an AI-powered CLI tool that transforms how you interact with your
              10X Accountability Coach. Instead of manual configuration and troubleshooting,
              simply describe what you want and let Claude Code handle it.
            </p>
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-purple-300 mb-1">Recommended Setup Method</p>
              <p className="text-xs text-oa-text-secondary">
                Claude Code provides the best experience for setting up and customizing your accountability coach.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Quick Start with Claude Code</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 text-xs overflow-x-auto">
{`# Clone the repository
git clone https://github.com/Anit-1to10x/10x-Accountabilty-Coach.git
cd 10x-Accoutability-Coach

# Let Claude Code do everything
claude "start my app"

# That's it! Claude Code will:
# ✓ Install all dependencies
# ✓ Ask for your API key if needed
# ✓ Configure environment variables
# ✓ Start the development server`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What Claude Code Can Do</h4>
            <div className="space-y-3 text-sm">
              <div className="border-l-2 border-purple-500 pl-3">
                <p className="font-medium">One-Command Setup</p>
                <p className="text-xs text-oa-text-secondary">
                  Say <code className="px-1 bg-oa-bg-secondary">"start my app"</code> and Claude Code
                  handles dependencies, API keys, and server startup automatically.
                </p>
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="font-medium">Real-Time Customization</p>
                <p className="text-xs text-oa-text-secondary">
                  Say <code className="px-1 bg-oa-bg-secondary">"add a meditation timer feature"</code> or
                  <code className="px-1 bg-oa-bg-secondary">"change the theme to blue"</code> and watch it happen.
                </p>
              </div>
              <div className="border-l-2 border-green-500 pl-3">
                <p className="font-medium">Instant Bug Fixes</p>
                <p className="text-xs text-oa-text-secondary">
                  Describe any issue and Claude Code diagnoses and fixes it immediately.
                  No more Stack Overflow searches or debugging sessions.
                </p>
              </div>
              <div className="border-l-2 border-orange-500 pl-3">
                <p className="font-medium">Feature Development</p>
                <p className="text-xs text-oa-text-secondary">
                  Say <code className="px-1 bg-oa-bg-secondary">"add weekly summary emails"</code> or
                  <code className="px-1 bg-oa-bg-secondary">"create a habit tracker widget"</code>
                  and Claude Code writes the code for you.
                </p>
              </div>
              <div className="border-l-2 border-pink-500 pl-3">
                <p className="font-medium">Learning & Understanding</p>
                <p className="text-xs text-oa-text-secondary">
                  Ask <code className="px-1 bg-oa-bg-secondary">"how does the streak system work?"</code> or
                  <code className="px-1 bg-oa-bg-secondary">"explain this component"</code>
                  for detailed explanations.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Example Commands</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-oa-bg-secondary border border-oa-border p-3 rounded">
                <code className="text-purple-400">"start my app"</code>
                <p className="text-oa-text-secondary mt-1">Full setup & launch</p>
              </div>
              <div className="bg-oa-bg-secondary border border-oa-border p-3 rounded">
                <code className="text-purple-400">"update my API key"</code>
                <p className="text-oa-text-secondary mt-1">Reconfigure API</p>
              </div>
              <div className="bg-oa-bg-secondary border border-oa-border p-3 rounded">
                <code className="text-purple-400">"add dark mode toggle"</code>
                <p className="text-oa-text-secondary mt-1">New feature</p>
              </div>
              <div className="bg-oa-bg-secondary border border-oa-border p-3 rounded">
                <code className="text-purple-400">"fix the calendar bug"</code>
                <p className="text-oa-text-secondary mt-1">Debug & fix</p>
              </div>
              <div className="bg-oa-bg-secondary border border-oa-border p-3 rounded">
                <code className="text-purple-400">"create a 7-day challenge"</code>
                <p className="text-oa-text-secondary mt-1">Generate content</p>
              </div>
              <div className="bg-oa-bg-secondary border border-oa-border p-3 rounded">
                <code className="text-purple-400">"optimize performance"</code>
                <p className="text-oa-text-secondary mt-1">Improve app</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Why Claude Code vs Manual Setup?</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="font-semibold text-green-400">✓ With Claude Code</p>
                <ul className="text-oa-text-secondary space-y-1">
                  <li>• Automatic API key configuration</li>
                  <li>• Instant dependency installation</li>
                  <li>• On-demand feature customization</li>
                  <li>• AI-powered debugging</li>
                  <li>• Natural language commands</li>
                  <li>• Continuous app evolution</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-orange-400">⚠ Manual Setup</p>
                <ul className="text-oa-text-secondary space-y-1">
                  <li>• Manual .env file editing</li>
                  <li>• Run npm install yourself</li>
                  <li>• Code changes require dev skills</li>
                  <li>• Debug issues with Stack Overflow</li>
                  <li>• Read documentation for commands</li>
                  <li>• Limited to existing features</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-oa-bg-secondary border border-oa-border p-4 rounded">
            <p className="text-xs font-semibold mb-2">Get Claude Code</p>
            <p className="text-xs text-oa-text-secondary mb-3">
              Download Claude Code from Anthropic to unlock the full potential of your accountability coach.
            </p>
            <a
              href="https://claude.ai/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
            >
              <span>Download Claude Code</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'navigation',
      title: 'Navigation',
      icon: '🧭',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">App Navigation</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Use the left sidebar to navigate between different sections of the app.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Main Sections</h4>
            <div className="space-y-2 text-sm">
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Home</p>
                <p className="text-xs text-oa-text-secondary">Unified chat with access to all data</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Schedule</p>
                <p className="text-xs text-oa-text-secondary">Calendar with challenge tasks (month/week/day views)</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Streak</p>
                <p className="text-xs text-oa-text-secondary">All challenges overview and progress</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Todos</p>
                <p className="text-xs text-oa-text-secondary">Task management</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Prompts</p>
                <p className="text-xs text-oa-text-secondary">Dynamic and custom AI prompts</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Workspace</p>
                <p className="text-xs text-oa-text-secondary">File browser for data folder</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Skills</p>
                <p className="text-xs text-oa-text-secondary">Browse and manage AI skills</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'challenges',
      title: 'Challenges',
      icon: '🎯',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Creating Challenges</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Challenges are your accountability goals. Each challenge has daily tasks,
              progress tracking, and streak counting.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Challenge Structure</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 text-xs overflow-x-auto">
{`data/challenges/{challenge-id}/
├── challenge.md      # Config and progress
├── plan.md           # Learning/activity plan
└── days/             # Daily task files
    ├── day-01.md
    ├── day-02.md
    └── ...`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Day File Format</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 text-xs overflow-x-auto">
{`# Day 1 - Topic Name

## Status: pending

## Tasks
- [ ] Task 1 (30 min)
- [ ] Task 2 (20 min)
- [ ] Task 3 (15 min)

## Check-in
- **Completed:** No
- **Mood:**
- **Blockers:** None`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Viewing Challenges</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• <strong>Streak page</strong> - Overview of all challenges</li>
              <li>• <strong>Streak detail</strong> - Click to see progress, tasks, check-in</li>
              <li>• <strong>Schedule</strong> - Tasks appear on their scheduled day</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'checkins',
      title: 'Daily Check-ins',
      icon: '✓',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">The Check-in Flow</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Check-ins are how you track progress and build your streak.
              Complete all 4 steps to log your day.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4-Step Check-in Process</h4>
            <ol className="text-sm text-oa-text-secondary space-y-3 list-decimal list-inside">
              <li>
                <strong>Task Selection</strong> - Mark which tasks you completed
              </li>
              <li>
                <strong>Mood Rating</strong> - Rate your energy (1-5 scale)
              </li>
              <li>
                <strong>Reflection</strong> - Record wins and blockers
              </li>
              <li>
                <strong>Commitment</strong> - Set tomorrow's intention
              </li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What Gets Updated</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• Task checkboxes in day files: <code className="px-1 bg-oa-bg-secondary">[ ]</code> → <code className="px-1 bg-oa-bg-secondary">[x]</code></li>
              <li>• Challenge progress percentage</li>
              <li>• Streak count in challenge.md</li>
              <li>• Check-in record in <code className="px-1 bg-oa-bg-secondary">data/checkins/</code></li>
              <li>• Registry for streak tracking</li>
            </ul>
          </div>

          <div className="bg-oa-bg-secondary border border-oa-border p-4">
            <p className="text-xs text-oa-text-secondary">
              <strong>Tip:</strong> You can also mark tasks complete directly from the Schedule or Streak pages
              without doing a full check-in.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'schedule',
      title: 'Schedule & Calendar',
      icon: '📅',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Calendar Features</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              The Schedule page shows your challenge tasks in a calendar view.
              Tasks are displayed on their scheduled day based on the challenge start date.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Calendar Views</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• <strong>Month View</strong> - Overview with task indicators</li>
              <li>• <strong>Week View</strong> - Weekly task breakdown</li>
              <li>• <strong>Day View</strong> - Detailed daily schedule</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Auto-Navigation</h4>
            <p className="text-sm text-oa-text-secondary mb-2">
              The calendar automatically navigates to your challenge start date.
              If your challenge starts in the future (e.g., January 1, 2026),
              the calendar will show that month.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Task Completion</h4>
            <p className="text-sm text-oa-text-secondary">
              Click on any task in the calendar to toggle its completion status.
              This updates the day file and challenge progress automatically.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'prompts',
      title: 'Dynamic Prompts',
      icon: '💬',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">AI-Powered Responses</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Dynamic prompts automatically match your messages and respond with
              personalized, context-aware templates.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Available Prompts</h4>
            <div className="space-y-2 text-sm">
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Motivation</p>
                <p className="text-xs text-oa-text-secondary">Say: "I need motivation" or "inspire me"</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Morning Check-in</p>
                <p className="text-xs text-oa-text-secondary">Say: "Good morning" or "start my day"</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Evening Review</p>
                <p className="text-xs text-oa-text-secondary">Say: "End of day" or "wrap up"</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Stuck</p>
                <p className="text-xs text-oa-text-secondary">Say: "I'm stuck" or "feeling blocked"</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Celebration</p>
                <p className="text-xs text-oa-text-secondary">Say: "I did it" or "celebrate with me"</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Accountability</p>
                <p className="text-xs text-oa-text-secondary">Say: "Hold me accountable" or "real talk"</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Planning</p>
                <p className="text-xs text-oa-text-secondary">Say: "Help me plan" or "let's organize"</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Creating Custom Prompts</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 text-xs overflow-x-auto">
{`# Your Prompt Name

- **Description:** What this prompt does
- **Keywords:** word1, word2, word3
- **Intent:** trigger phrase 1, trigger phrase 2
- **Category:** your-category
- **Priority:** 10

## Template

Hey {{name}}! Your personalized message...

Available: {{today_date}}, {{pending_tasks}},
{{current_streak}}, {{task_list}}, etc.`}
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: 'backlog',
      title: 'Backlog Handling',
      icon: '📋',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Managing Missed Tasks</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              When you miss tasks, the system detects them as backlog and offers
              options to recover without giving up on your challenge.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Backlog Notification</h4>
            <p className="text-sm text-oa-text-secondary mb-3">
              A notification appears when incomplete tasks from past days are detected.
              You'll see two options:
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Option 1: Adjust Tomorrow</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• Moves incomplete tasks to tomorrow</li>
              <li>• Adds a "Backlog" section to tomorrow's day file</li>
              <li>• Preserves original task structure</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Option 2: Regenerate Plan</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• Analyzes your completion pace</li>
              <li>• Redistributes remaining tasks across future days</li>
              <li>• Updates all future day files</li>
              <li>• Better for significant schedule changes</li>
            </ul>
          </div>

          <div className="bg-oa-bg-secondary border border-oa-border p-4">
            <p className="text-xs text-oa-text-secondary">
              <strong>Tip:</strong> Use "Adjust Tomorrow" for occasional misses.
              Use "Regenerate Plan" if you need to restructure your entire challenge.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'file-structure',
      title: 'Data Structure',
      icon: '📁',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Understanding Your Data</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              All data is stored in the <code className="px-2 py-1 bg-oa-bg-secondary">data/</code> folder.
              Files are human-readable markdown and JSON.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Directory Structure</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 text-xs overflow-x-auto leading-relaxed">
{`data/
├── profiles/              # Per-user data
│   └── {user-id}/
│       ├── profile.md     # User info
│       ├── availability.md
│       ├── preferences.md
│       ├── challenges/    # User's progress
│       ├── chats/         # Chat history
│       ├── checkins/      # Check-ins
│       └── todos/         # Tasks
│
├── challenges/            # Challenge data
│   └── {challenge-id}/
│       ├── challenge.md   # Config & progress
│       ├── plan.md        # Learning plan
│       └── days/          # Daily tasks
│
├── prompts/               # Global prompts
│   ├── motivation.md
│   ├── morning-checkin.md
│   └── ...
│
├── agents/                # Agent configs
├── chats/                 # Global chats
├── checkins/              # Check-in records
└── .cache-index.json      # Cache index`}
            </pre>
          </div>

          <div className="bg-oa-bg-secondary border border-oa-border p-4">
            <p className="text-xs font-semibold mb-2">Tips</p>
            <ul className="text-xs text-oa-text-secondary space-y-1">
              <li>• Backup the data/ folder regularly</li>
              <li>• Edit markdown files directly for quick fixes</li>
              <li>• Delete .cache-index.json to rebuild cache</li>
              <li>• Use Workspace page to browse files</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: '🔧',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Common Issues</h3>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Chat Not Responding</h4>
            <ol className="text-sm text-oa-text-secondary space-y-1 list-decimal list-inside">
              <li>Check WebSocket server is running (port 8765)</li>
              <li>Verify profile exists in data/profiles/</li>
              <li>Restart app with <code className="px-1 bg-oa-bg-secondary">npm start</code></li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Profile Not Found</h4>
            <ol className="text-sm text-oa-text-secondary space-y-1 list-decimal list-inside">
              <li>Check data/profiles/{'{user-id}'}/profile.md exists</li>
              <li>Delete data/.cache-index.json</li>
              <li>Restart app to rebuild cache</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Ports Already in Use</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 text-xs">
{`# Find processes
netstat -ano | findstr ":8765 :3000"

# Kill by PID
taskkill /F /PID <pid>`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tasks Not Showing in Calendar</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• Check challenge has correct start date</li>
              <li>• Verify day files exist in data/challenges/{'{id}'}/days/</li>
              <li>• Ensure day files have task checkboxes</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Streak Not Updating</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• Complete a check-in for the day</li>
              <li>• Check challenge.md has correct streak format</li>
              <li>• Verify registry at data/.registry/challenges.json</li>
            </ul>
          </div>
        </div>
      ),
    },
  ]

  const activeContent = sections.find((s) => s.id === activeSection)

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-title font-semibold mb-2">Help & Documentation</h1>
          <p className="text-sm text-oa-text-secondary">
            Everything you need to know about using OpenAnalyst Accountability Coach
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {/* Left: Section Navigation */}
          <div className="col-span-1 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-3 border transition-colors ${
                  activeSection === section.id
                    ? 'border-oa-text-primary bg-oa-bg-secondary'
                    : 'border-oa-border hover:bg-oa-bg-secondary'
                }`}
              >
                <div className="text-lg mb-1">{section.icon}</div>
                <div className="text-xs font-medium">{section.title}</div>
              </button>
            ))}
          </div>

          {/* Right: Section Content */}
          <div className="col-span-3">
            <Card className="p-6">
              {activeContent?.content}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
