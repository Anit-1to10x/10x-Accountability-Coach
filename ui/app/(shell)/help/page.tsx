'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui'
import {
  Rocket,
  Bot,
  Compass,
  Target,
  CheckCircle,
  Calendar,
  MessageSquare,
  ClipboardList,
  FolderTree,
  Wrench,
  Sparkles,
  Terminal,
  Zap,
  Settings,
  Users,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

type GuideSection = {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<string>('getting-started')

  const sections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Rocket className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-oa-accent" />
              Welcome to 10X Accountability Coach
            </h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Your personal AI-powered accountability system designed to help you achieve your goals
              through structured challenges, daily check-ins, and personalized coaching. Everything
              runs locally, and all your data is stored securely in your <code className="px-2 py-1 bg-oa-bg-secondary border border-oa-border rounded">data/</code> folder.
            </p>
          </div>

          <div className="bg-gradient-to-r from-oa-accent/10 to-blue-500/10 border border-oa-accent/30 rounded-xl p-5">
            <h4 className="font-semibold mb-3 text-oa-accent">Quick Start Guide</h4>
            <ol className="text-sm text-oa-text-secondary space-y-3 list-decimal list-inside">
              <li><strong>Create Your Profile</strong> - Complete the onboarding to set up your personal profile</li>
              <li><strong>Create a Challenge</strong> - Go to Streak section and create your first 30-day challenge</li>
              <li><strong>Check In Daily</strong> - Complete tasks and check in to build your streak</li>
              <li><strong>Chat with Your Coach</strong> - Use the AI chat for motivation, planning, and guidance</li>
              <li><strong>Track Progress</strong> - View your streaks, tasks, and achievements in the dashboard</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-oa-bg-secondary rounded-lg p-4 border border-oa-border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                Core Features
              </h4>
              <ul className="text-xs text-oa-text-secondary space-y-1">
                <li>• AI-powered streaming chat</li>
                <li>• Challenge & streak tracking</li>
                <li>• Daily check-in system</li>
                <li>• Task management</li>
                <li>• Calendar scheduling</li>
                <li>• Multiple AI agents</li>
              </ul>
            </div>
            <div className="bg-oa-bg-secondary rounded-lg p-4 border border-oa-border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                What Gets Started
              </h4>
              <ul className="text-xs text-oa-text-secondary space-y-1">
                <li>• Next.js UI at localhost:3000</li>
                <li>• AI Chat with streaming</li>
                <li>• MCP Tools integration</li>
                <li>• Sandbox code execution</li>
                <li>• Skills matching system</li>
                <li>• Fast cache system</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ai-chat',
      title: 'AI Chat & Agents',
      icon: <MessageSquare className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">AI-Powered Coaching</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              The chat system provides real-time AI coaching with streaming responses.
              You can chat naturally to get motivation, plan tasks, review progress, or get help
              with any aspect of your accountability journey.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Chat Features</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <p className="font-medium text-sm mb-1">Streaming Responses</p>
                <p className="text-xs text-oa-text-secondary">See AI responses as they generate in real-time</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <p className="font-medium text-sm mb-1">Context Awareness</p>
                <p className="text-xs text-oa-text-secondary">AI knows your challenges, streaks, and tasks</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <p className="font-medium text-sm mb-1">File Attachments</p>
                <p className="text-xs text-oa-text-secondary">Attach files for AI analysis and feedback</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <p className="font-medium text-sm mb-1">Skills Auto-Match</p>
                <p className="text-xs text-oa-text-secondary">AI automatically uses relevant skills</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Multiple AI Agents</h4>
            <p className="text-sm text-oa-text-secondary mb-3">
              Beyond the unified chat, you have access to specialized AI agents for different tasks:
            </p>
            <div className="space-y-2">
              <div className="border-l-2 border-purple-500 pl-3">
                <p className="font-medium text-sm">Unified Chat</p>
                <p className="text-xs text-oa-text-secondary">General-purpose coach with access to all data</p>
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="font-medium text-sm">Challenge Agent</p>
                <p className="text-xs text-oa-text-secondary">Specialized in creating and managing challenges</p>
              </div>
              <div className="border-l-2 border-green-500 pl-3">
                <p className="font-medium text-sm">Motivation Agent</p>
                <p className="text-xs text-oa-text-secondary">Focused on encouragement and mindset coaching</p>
              </div>
              <div className="border-l-2 border-orange-500 pl-3">
                <p className="font-medium text-sm">Planning Agent</p>
                <p className="text-xs text-oa-text-secondary">Helps organize tasks and create schedules</p>
              </div>
            </div>
          </div>

          <div className="bg-oa-bg-secondary border border-oa-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Status Indicators</h4>
            <p className="text-xs text-oa-text-secondary mb-3">
              Watch the status bar to see what the AI is doing:
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Thinking</span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">Matching Skill</span>
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">Executing Tool</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">Generating</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'skills-commands',
      title: 'Skills & Commands',
      icon: <Terminal className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Skills System</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Skills are specialized AI capabilities that get automatically matched to your messages.
              The system has 20+ built-in skills for accountability coaching.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Slash Commands</h4>
            <p className="text-sm text-oa-text-secondary mb-3">
              Use these commands in chat for quick actions:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <code className="text-oa-accent text-sm">/streak</code>
                <p className="text-xs text-oa-text-secondary mt-1">Check in to your active challenge</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <code className="text-oa-accent text-sm">/streak-new</code>
                <p className="text-xs text-oa-text-secondary mt-1">Create a new challenge</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <code className="text-oa-accent text-sm">/streak-list</code>
                <p className="text-xs text-oa-text-secondary mt-1">View all your challenges</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <code className="text-oa-accent text-sm">/streak-stats</code>
                <p className="text-xs text-oa-text-secondary mt-1">View detailed statistics</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <code className="text-oa-accent text-sm">/streak-switch</code>
                <p className="text-xs text-oa-text-secondary mt-1">Switch active challenge</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <code className="text-oa-accent text-sm">/streak-insights</code>
                <p className="text-xs text-oa-text-secondary mt-1">Cross-challenge insights</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Natural Language Skills</h4>
            <p className="text-sm text-oa-text-secondary mb-3">
              The AI automatically matches these phrases to skills:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-oa-text-secondary">"I need motivation"</span>
                <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
                <span className="text-oa-accent">Motivation Skill</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-oa-text-secondary">"Help me plan my week"</span>
                <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
                <span className="text-oa-accent">Planning Skill</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-oa-text-secondary">"I'm stuck"</span>
                <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
                <span className="text-oa-accent">Obstacle Skill</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-oa-text-secondary">"I did it!"</span>
                <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
                <span className="text-oa-accent">Celebration Skill</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-oa-text-secondary">"Hold me accountable"</span>
                <ChevronRight className="w-4 h-4 text-oa-text-secondary" />
                <span className="text-oa-accent">Accountability Skill</span>
              </div>
            </div>
          </div>

          <div className="bg-oa-bg-secondary border border-oa-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Browse All Skills</h4>
            <p className="text-xs text-oa-text-secondary mb-3">
              Visit the Skills page to see all available skills, their triggers, and customize them.
            </p>
            <a href="/skills" className="inline-flex items-center gap-2 text-oa-accent text-sm hover:underline">
              Go to Skills <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'claude-code',
      title: 'Claude Code',
      icon: <Bot className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Supercharge with Claude Code</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Claude Code is an AI-powered CLI tool that transforms how you interact with your
              10X Accountability Coach. Simply describe what you want and let Claude Code handle it.
            </p>
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-purple-300 mb-1">Recommended for Power Users</p>
              <p className="text-xs text-oa-text-secondary">
                Claude Code provides the best experience for customizing and extending your accountability coach.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">One-Command Setup</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 rounded-lg text-xs overflow-x-auto">
{`# Let Claude Code handle everything
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
                <p className="font-medium">Automatic Setup</p>
                <p className="text-xs text-oa-text-secondary">Dependencies, API keys, and server startup</p>
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <p className="font-medium">Real-Time Customization</p>
                <p className="text-xs text-oa-text-secondary">"Add a meditation timer" or "change theme to blue"</p>
              </div>
              <div className="border-l-2 border-green-500 pl-3">
                <p className="font-medium">Instant Bug Fixes</p>
                <p className="text-xs text-oa-text-secondary">Describe any issue and Claude fixes it immediately</p>
              </div>
              <div className="border-l-2 border-orange-500 pl-3">
                <p className="font-medium">Feature Development</p>
                <p className="text-xs text-oa-text-secondary">"Add weekly summary emails" creates the feature</p>
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
                <code className="text-purple-400">"create a 7-day challenge"</code>
                <p className="text-oa-text-secondary mt-1">Generate content</p>
              </div>
              <div className="bg-oa-bg-secondary border border-oa-border p-3 rounded">
                <code className="text-purple-400">"fix the calendar bug"</code>
                <p className="text-oa-text-secondary mt-1">Debug & fix</p>
              </div>
            </div>
          </div>

          <div className="bg-oa-bg-secondary border border-oa-border p-4 rounded-lg">
            <p className="text-xs font-semibold mb-2">Get Claude Code</p>
            <p className="text-xs text-oa-text-secondary mb-3">
              Download Claude Code from Anthropic to unlock the full potential.
            </p>
            <a
              href="https://claude.ai/download"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
            >
              Download Claude Code
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ),
    },
    {
      id: 'navigation',
      title: 'Navigation',
      icon: <Compass className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">App Navigation</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Use the left sidebar to navigate between different sections of the app.
              Each section is designed for a specific aspect of your accountability journey.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Main Sections</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Home / Chat</p>
                  <p className="text-xs text-oa-text-secondary">Unified AI chat with access to all your data</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Schedule</p>
                  <p className="text-xs text-oa-text-secondary">Calendar with challenge tasks (month/week/day views)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Streak</p>
                  <p className="text-xs text-oa-text-secondary">All challenges overview, streaks, and progress</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Todos</p>
                  <p className="text-xs text-oa-text-secondary">Task management and to-do lists</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Skills</p>
                  <p className="text-xs text-oa-text-secondary">Browse and manage AI skills</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <FolderTree className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Workspace</p>
                  <p className="text-xs text-oa-text-secondary">File browser for your data folder</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Settings</p>
                  <p className="text-xs text-oa-text-secondary">API keys, preferences, and configuration</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'challenges',
      title: 'Challenges',
      icon: <Target className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Creating Challenges</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Challenges are your accountability goals. Each challenge has daily tasks,
              progress tracking, and streak counting. Create challenges to build lasting habits.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Challenge Types</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <p className="font-medium text-sm">30-Day Challenge</p>
                <p className="text-xs text-oa-text-secondary">Standard monthly habit building</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <p className="font-medium text-sm">7-Day Sprint</p>
                <p className="text-xs text-oa-text-secondary">Quick focused week</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <p className="font-medium text-sm">Custom Duration</p>
                <p className="text-xs text-oa-text-secondary">Any length you need</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border">
                <p className="font-medium text-sm">Learning Path</p>
                <p className="text-xs text-oa-text-secondary">Skill development track</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Challenge Structure</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 rounded-lg text-xs overflow-x-auto">
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
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 rounded-lg text-xs overflow-x-auto">
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

          <div className="bg-oa-bg-secondary border border-oa-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Creating a Challenge</h4>
            <ol className="text-xs text-oa-text-secondary space-y-1 list-decimal list-inside">
              <li>Go to the Streak page</li>
              <li>Click "New Challenge" button</li>
              <li>Or type <code className="px-1 bg-oa-bg-tertiary rounded">/streak-new</code> in chat</li>
              <li>Follow the AI-guided creation process</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'checkins',
      title: 'Daily Check-ins',
      icon: <CheckCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">The Check-in Flow</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Check-ins are how you track progress and build your streak.
              Complete all steps to log your day and maintain your accountability.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">4-Step Check-in Process</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                <div>
                  <p className="font-medium text-sm">Task Selection</p>
                  <p className="text-xs text-oa-text-secondary">Mark which tasks you completed today</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">2</div>
                <div>
                  <p className="font-medium text-sm">Mood Rating</p>
                  <p className="text-xs text-oa-text-secondary">Rate your energy on a 1-5 scale</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">3</div>
                <div>
                  <p className="font-medium text-sm">Reflection</p>
                  <p className="text-xs text-oa-text-secondary">Record your wins and blockers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">4</div>
                <div>
                  <p className="font-medium text-sm">Commitment</p>
                  <p className="text-xs text-oa-text-secondary">Set tomorrow's intention</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What Gets Updated</h4>
            <ul className="text-sm text-oa-text-secondary space-y-1">
              <li>• Task checkboxes: <code className="px-1 bg-oa-bg-secondary rounded">[ ]</code> → <code className="px-1 bg-oa-bg-secondary rounded">[x]</code></li>
              <li>• Challenge progress percentage</li>
              <li>• Streak count in challenge.md</li>
              <li>• Check-in record saved to data/checkins/</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-xs text-oa-text-secondary">
              <strong className="text-green-400">Quick Tip:</strong> You can also mark tasks complete directly from the Schedule
              or Streak pages without doing a full check-in. Use <code className="px-1 bg-oa-bg-secondary rounded">/streak</code> in chat for fast check-ins.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'schedule',
      title: 'Schedule & Calendar',
      icon: <Calendar className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Calendar Features</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              The Schedule page shows your challenge tasks in a beautiful calendar view.
              Tasks are displayed on their scheduled day based on the challenge start date.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Calendar Views</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border text-center">
                <p className="font-medium text-sm">Month View</p>
                <p className="text-xs text-oa-text-secondary">Overview with task indicators</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border text-center">
                <p className="font-medium text-sm">Week View</p>
                <p className="text-xs text-oa-text-secondary">Weekly task breakdown</p>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-3 border border-oa-border text-center">
                <p className="font-medium text-sm">Day View</p>
                <p className="text-xs text-oa-text-secondary">Detailed daily schedule</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Features</h4>
            <ul className="text-sm text-oa-text-secondary space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span><strong>Auto-Navigation:</strong> Calendar jumps to your challenge start date</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span><strong>Task Completion:</strong> Click tasks to toggle completion status</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span><strong>Color Coding:</strong> See completed vs pending at a glance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                <span><strong>Multiple Challenges:</strong> View tasks from all active challenges</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'prompts',
      title: 'Dynamic Prompts',
      icon: <Sparkles className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">AI-Powered Responses</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Dynamic prompts automatically match your messages and respond with
              personalized, context-aware templates.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Available Prompts</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="border-l-2 border-purple-500 pl-3 py-1">
                <p className="font-medium">Motivation</p>
                <p className="text-xs text-oa-text-secondary">"I need motivation" or "inspire me"</p>
              </div>
              <div className="border-l-2 border-blue-500 pl-3 py-1">
                <p className="font-medium">Morning Check-in</p>
                <p className="text-xs text-oa-text-secondary">"Good morning" or "start my day"</p>
              </div>
              <div className="border-l-2 border-orange-500 pl-3 py-1">
                <p className="font-medium">Evening Review</p>
                <p className="text-xs text-oa-text-secondary">"End of day" or "wrap up"</p>
              </div>
              <div className="border-l-2 border-red-500 pl-3 py-1">
                <p className="font-medium">Stuck/Blocked</p>
                <p className="text-xs text-oa-text-secondary">"I'm stuck" or "feeling blocked"</p>
              </div>
              <div className="border-l-2 border-green-500 pl-3 py-1">
                <p className="font-medium">Celebration</p>
                <p className="text-xs text-oa-text-secondary">"I did it" or "celebrate with me"</p>
              </div>
              <div className="border-l-2 border-amber-500 pl-3 py-1">
                <p className="font-medium">Accountability</p>
                <p className="text-xs text-oa-text-secondary">"Hold me accountable" or "real talk"</p>
              </div>
              <div className="border-l-2 border-cyan-500 pl-3 py-1">
                <p className="font-medium">Planning</p>
                <p className="text-xs text-oa-text-secondary">"Help me plan" or "let's organize"</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Available Variables</h4>
            <div className="bg-oa-bg-secondary border border-oa-border rounded-lg p-3">
              <code className="text-xs text-oa-text-secondary">
                {`{{name}}, {{today_date}}, {{pending_tasks}}, {{current_streak}}, {{task_list}}, {{challenge_name}}, {{progress}}`}
              </code>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'backlog',
      title: 'Backlog Handling',
      icon: <ClipboardList className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Managing Missed Tasks</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              When you miss tasks, the system detects them as backlog and offers
              options to recover without giving up on your challenge.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Recovery Options</h4>
            <div className="space-y-4">
              <div className="bg-oa-bg-secondary rounded-lg p-4 border border-blue-500/30">
                <h5 className="font-medium text-blue-400 mb-2">Option 1: Adjust Tomorrow</h5>
                <ul className="text-xs text-oa-text-secondary space-y-1">
                  <li>• Moves incomplete tasks to tomorrow</li>
                  <li>• Adds a "Backlog" section to tomorrow's day file</li>
                  <li>• Preserves original task structure</li>
                  <li>• Best for occasional misses</li>
                </ul>
              </div>
              <div className="bg-oa-bg-secondary rounded-lg p-4 border border-purple-500/30">
                <h5 className="font-medium text-purple-400 mb-2">Option 2: Regenerate Plan</h5>
                <ul className="text-xs text-oa-text-secondary space-y-1">
                  <li>• Analyzes your completion pace</li>
                  <li>• Redistributes remaining tasks across future days</li>
                  <li>• Updates all future day files</li>
                  <li>• Better for significant schedule changes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-xs text-oa-text-secondary">
              <strong className="text-amber-400">Pro Tip:</strong> Don't let backlog pile up!
              Check in daily even if you haven't completed all tasks. Partial progress is better than no tracking.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'settings',
      title: 'Settings & Config',
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Configuration</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              Configure your API keys, preferences, and customize the coaching experience in Settings.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">API Key Setup</h4>
            <ol className="text-sm text-oa-text-secondary space-y-2 list-decimal list-inside">
              <li>Visit <a href="https://10x.in/dashboard" target="_blank" className="text-oa-accent hover:underline">10x.in/dashboard</a></li>
              <li>Enter your email address</li>
              <li>Check your inbox for the API key</li>
              <li>Paste the key in Settings → API Configuration</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Environment File</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 rounded-lg text-xs overflow-x-auto">
{`# ui/.env.local

# OpenAnalyst AI API (Required)
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=sk-oa-v1-your-key-here
OPENANALYST_MODEL=openanalyst-beta`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Settings Sections</h4>
            <div className="space-y-2 text-sm">
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Profile</p>
                <p className="text-xs text-oa-text-secondary">Your name, avatar, and personal info</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">API Configuration</p>
                <p className="text-xs text-oa-text-secondary">API keys and connection settings</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">Agent Settings</p>
                <p className="text-xs text-oa-text-secondary">Configure AI agent behaviors</p>
              </div>
              <div className="border-l-2 border-oa-border pl-3">
                <p className="font-medium">MCP Servers</p>
                <p className="text-xs text-oa-text-secondary">Model Context Protocol integrations</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'file-structure',
      title: 'Data Structure',
      icon: <FolderTree className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Understanding Your Data</h3>
            <p className="text-sm text-oa-text-secondary leading-relaxed mb-4">
              All data is stored in the <code className="px-2 py-1 bg-oa-bg-secondary rounded">data/</code> folder.
              Files are human-readable markdown and JSON - you can edit them directly!
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Directory Structure</h4>
            <pre className="bg-oa-bg-secondary border border-oa-border p-4 rounded-lg text-xs overflow-x-auto leading-relaxed">
{`data/
├── profiles/              # Per-user data
│   └── {user-id}/
│       ├── profile.md     # User info
│       ├── challenges/    # User's progress
│       ├── chats/         # Chat history
│       ├── checkins/      # Check-in records
│       └── todos/         # Tasks
│
├── challenges/            # Challenge data
│   └── {challenge-id}/
│       ├── challenge.md   # Config & progress
│       ├── plan.md        # Learning plan
│       └── days/          # Daily tasks
│
├── prompts/               # AI prompts
├── skills/                # Skill definitions
├── agents/                # Agent configs
└── .cache-index.json      # Cache index`}
            </pre>
          </div>

          <div className="bg-oa-bg-secondary border border-oa-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">Tips</h4>
            <ul className="text-xs text-oa-text-secondary space-y-1">
              <li>• Backup the data/ folder regularly</li>
              <li>• Edit markdown files directly for quick fixes</li>
              <li>• Delete .cache-index.json to rebuild cache</li>
              <li>• Use Workspace page to browse files in-app</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <Wrench className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-3">Common Issues</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-oa-bg-secondary rounded-lg p-4 border border-oa-border">
              <h4 className="font-semibold mb-2 text-red-400">API Disconnected</h4>
              <ol className="text-xs text-oa-text-secondary space-y-1 list-decimal list-inside">
                <li>Check ui/.env.local has a real API key (not placeholder)</li>
                <li>Verify no extra spaces before/after the key</li>
                <li>Restart the dev server</li>
              </ol>
            </div>

            <div className="bg-oa-bg-secondary rounded-lg p-4 border border-oa-border">
              <h4 className="font-semibold mb-2 text-orange-400">Chat Not Responding</h4>
              <ol className="text-xs text-oa-text-secondary space-y-1 list-decimal list-inside">
                <li>Check the browser console for errors</li>
                <li>Verify profile exists in data/profiles/</li>
                <li>Restart with <code className="px-1 bg-oa-bg-tertiary rounded">npm start</code></li>
              </ol>
            </div>

            <div className="bg-oa-bg-secondary rounded-lg p-4 border border-oa-border">
              <h4 className="font-semibold mb-2 text-yellow-400">Port Already in Use</h4>
              <pre className="text-xs bg-oa-bg-tertiary p-2 rounded mt-2">
{`npx kill-port 3000
cd ui && npm run dev`}
              </pre>
            </div>

            <div className="bg-oa-bg-secondary rounded-lg p-4 border border-oa-border">
              <h4 className="font-semibold mb-2 text-blue-400">Tasks Not Showing in Calendar</h4>
              <ul className="text-xs text-oa-text-secondary space-y-1">
                <li>• Check challenge has correct start date</li>
                <li>• Verify day files exist in data/challenges/{'{id}'}/days/</li>
                <li>• Ensure day files have task checkboxes</li>
              </ul>
            </div>

            <div className="bg-oa-bg-secondary rounded-lg p-4 border border-oa-border">
              <h4 className="font-semibold mb-2 text-purple-400">Streak Not Updating</h4>
              <ul className="text-xs text-oa-text-secondary space-y-1">
                <li>• Complete a check-in for the day</li>
                <li>• Check challenge.md has correct streak format</li>
                <li>• Try deleting .cache-index.json</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-xs text-oa-text-secondary">
              <strong className="text-green-400">Need More Help?</strong> Use Claude Code and say
              "I'm having an issue with..." - it can diagnose and fix most problems automatically!
            </p>
          </div>
        </div>
      ),
    },
  ]

  const activeContent = sections.find((s) => s.id === activeSection)

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-oa-accent/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-oa-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Help & Documentation</h1>
              <p className="text-sm text-oa-text-secondary">
                Everything you need to know about 10X Accountability Coach
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Section Navigation */}
          <div className="col-span-3 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                  activeSection === section.id
                    ? 'border-oa-accent bg-oa-accent/10 text-oa-text-primary'
                    : 'border-transparent hover:bg-oa-bg-secondary text-oa-text-secondary hover:text-oa-text-primary'
                }`}
              >
                <div className={`${activeSection === section.id ? 'text-oa-accent' : ''}`}>
                  {section.icon}
                </div>
                <span className="text-sm font-medium">{section.title}</span>
              </button>
            ))}
          </div>

          {/* Right: Section Content */}
          <div className="col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6">
                  {activeContent?.content}
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
