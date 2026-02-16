'use client'

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Users, Clock, Shield, FileText, Download, Trash2, ChevronDown, ChevronRight, Edit2, HelpCircle, BookOpen, Zap, CheckCircle, XCircle, Database, Server, Loader2, Check, Bot, Key } from 'lucide-react'
import { addProfileId, useProfileId, getProfileHeaders } from '@/lib/useProfileId'

// Lazy load heavy components
const DataSourceToggle = lazy(() => import('@/components/settings/DataSourceToggle').then(mod => ({ default: mod.DataSourceToggle })))
const MCPManager = lazy(() => import('@/components/settings/MCPManager').then(mod => ({ default: mod.MCPManager })))
const AgentSettings = lazy(() => import('@/components/settings/AgentSettings').then(mod => ({ default: mod.AgentSettings })))
const APIKeyManager = lazy(() => import('@/components/settings/APIKeyManager').then(mod => ({ default: mod.APIKeyManager })))

// Loading skeleton component
function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader2 className="w-6 h-6 text-oa-accent" />
      </motion.div>
    </div>
  )
}

export default function SettingsPage() {
  const profileId = useProfileId()
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    timezone: '',
    photo: '',
  })
  const [onboardingData, setOnboardingData] = useState<any>(null)
  const [availability, setAvailability] = useState<any>(null)
  const [contracts, setContracts] = useState<any[]>([])
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState({
    accountabilityStyle: '',
    notifications: true,
    reminders: true,
    language: 'en',
    theme: 'dark',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [apiStatus, setApiStatus] = useState<{
    openanalyst: { configured: boolean; url: string; model: string; required: boolean; description: string; envKey: string; getKeyUrl: string; instructions: string }
    gemini: { configured: boolean; model: string; imageModel: string; required: boolean; description: string; envKey: string; getKeyUrl: string; instructions: string; usedBy: string[] }
    brave: { configured: boolean; required: boolean; description: string; envKey: string; getKeyUrl: string; instructions: string; usedBy: string[] }
    perplexity: { configured: boolean; required: boolean; description: string; envKey: string; getKeyUrl: string; instructions: string; usedBy: string[] }
    serper: { configured: boolean; required: boolean; description: string; envKey: string; getKeyUrl: string; instructions: string; usedBy: string[] }
    summary: { mainBrainConfigured: boolean; optionalServicesConfigured: string[]; missingRequired: string[] }
  } | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    apiStatus: true,
    apiKeys: false,
    dataStorage: false,
    mcp: false,
    agentSettings: false,
    profile: true,
    profiles: false,
    onboarding: true,
    availability: false,
    contracts: false,
    preferences: false,
    help: false,
    privacy: false,
  })

  useEffect(() => {
    loadAllData()
  }, [])

  // Re-fetch when files change via CLI
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.category === 'profile' || detail?.category === 'agent') {
        loadAllData()
      }
    }
    window.addEventListener('file-sync', handler)
    return () => window.removeEventListener('file-sync', handler)
  }, [])

  const loadAllData = async () => {
    try {
      // Load API status
      try {
        const statusRes = await fetch('/api/status')
        const statusData = await statusRes.json()
        setApiStatus(statusData)
      } catch (err) {
        console.error('Failed to load API status:', err)
      }

      // Get active profile ID from localStorage
      const currentProfileId = typeof window !== 'undefined' ? localStorage.getItem('activeProfileId') : null
      setActiveProfileId(currentProfileId)

      // Load profile using status API with profileId
      const profileRes = await fetch(`/api/user/status${currentProfileId ? `?profileId=${currentProfileId}` : ''}`)
      const profileData = await profileRes.json()
      if (profileData.user) {
        setProfile({
          name: profileData.user.name || '',
          email: profileData.user.email || '',
          timezone: profileData.user.timezone || '',
          photo: '',
        })
      }

      // Load onboarding data with profileId
      if (currentProfileId) {
        const onboardingRes = await fetch(`/api/user/onboarding?profileId=${currentProfileId}`)
        const onboardingDataRes = await onboardingRes.json()
        setOnboardingData(onboardingDataRes)
      }

      // Load availability with profileId
      const availRes = await fetch(`/api/user/availability${currentProfileId ? `?profileId=${currentProfileId}` : ''}`)
      const availData = await availRes.json()
      setAvailability(availData)

      // Load all profiles
      try {
        const profilesRes = await fetch('/api/profiles')
        const profilesData = await profilesRes.json()
        setAllProfiles(profilesData.profiles || [])
      } catch (err) {
        console.error('Failed to load profiles:', err)
      }

      // Load contracts
      const contractsUrl = addProfileId('/api/contracts', profileId)
      const contractsRes = await fetch(contractsUrl)
      const contractsData = await contractsRes.json()
      setContracts(contractsData.contracts || [])

      // Set preferences if exists
      if (profileData.preferences) {
        setPreferences({
          accountabilityStyle: profileData.preferences.accountabilityStyle || '',
          notifications: profileData.preferences.notifications !== false,
          reminders: profileData.preferences.reminders !== false,
          language: profileData.preferences.language || 'en',
          theme: profileData.preferences.theme || 'dark',
        })
      }
    } catch (error) {
      console.error('Failed to load settings data:', error)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const url = addProfileId('/api/user/profile', profileId)
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getProfileHeaders(profileId) },
        body: JSON.stringify({ profile, preferences, profileId }),
      })
      alert('Profile saved successfully!')
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleExportData = () => {
    // TODO: Implement data export
    alert('Data export will be implemented by Claude Code')
  }

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      // TODO: Implement via Claude Code
      alert('This will be handled by Claude Code')
    }
  }

  const handleResetApp = () => {
    if (confirm('Are you sure you want to reset the app? ALL DATA will be deleted. This cannot be undone.')) {
      // TODO: Implement via Claude Code
      alert('This will be handled by Claude Code')
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-oa-bg-primary">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-oa-text-primary mb-2">Settings</h1>
          <p className="text-sm text-oa-text-secondary">
            Manage your profile, preferences, and account settings
          </p>
        </div>

        {/* API Status Section */}
        <Section
          title="API Status"
          subtitle="Check your API connections"
          icon={<Zap className="w-5 h-5" />}
          isExpanded={expandedSections.apiStatus}
          onToggle={() => toggleSection('apiStatus')}
        >
          {apiStatus ? (
            <div className="space-y-4">
              {/* Warning banner if main API not configured */}
              {!apiStatus.summary.mainBrainConfigured && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-400 mb-1">OpenAnalyst API Key Required</h4>
                      <p className="text-xs text-red-300 mb-2">
                        The main AI brain is not configured. The app will not work without this API key.
                      </p>
                      <ol className="text-xs text-red-300 space-y-1 list-decimal list-inside mb-3">
                        <li>Get your API key at <a href="https://10x.in/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">https://10x.in/dashboard</a></li>
                        <li>Add <code className="bg-red-500/20 px-1 py-0.5 rounded">OPENANALYST_API_KEY=sk-oa-v1-xxx</code> to <code className="bg-red-500/20 px-1 py-0.5 rounded">ui/.env.local</code></li>
                        <li>Restart the development server</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* Required: OpenAnalyst API */}
              <div className={`p-4 rounded-lg border ${apiStatus.openanalyst.configured ? 'bg-oa-bg-tertiary border-oa-border' : 'bg-red-500/5 border-red-500/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {apiStatus.openanalyst.configured ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-oa-text-primary">OpenAnalyst API</h4>
                      <p className="text-xs text-oa-text-secondary">{apiStatus.openanalyst.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">Required</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${apiStatus.openanalyst.configured ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {apiStatus.openanalyst.configured ? 'Connected' : 'Missing'}
                    </span>
                  </div>
                </div>
                {apiStatus.openanalyst.configured ? (
                  <p className="text-xs text-oa-text-secondary ml-8">Model: {apiStatus.openanalyst.model}</p>
                ) : (
                  <a href={apiStatus.openanalyst.getKeyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-oa-accent hover:underline ml-8">
                    Get API Key →
                  </a>
                )}
              </div>

              <div className="border-t border-oa-border pt-4 mt-4">
                <h4 className="text-sm font-medium text-oa-text-primary mb-3">Optional Services</h4>
                <p className="text-xs text-oa-text-secondary mb-4">These APIs enable additional features but are not required for basic functionality.</p>
              </div>

              {/* Optional: Gemini API */}
              <div className="p-4 bg-oa-bg-tertiary rounded-lg border border-oa-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {apiStatus.gemini.configured ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-yellow-500/50" />
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-oa-text-primary">Gemini API</h4>
                      <p className="text-xs text-oa-text-secondary">{apiStatus.gemini.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${apiStatus.gemini.configured ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {apiStatus.gemini.configured ? 'Connected' : 'Not configured'}
                  </span>
                </div>
                <div className="ml-8">
                  {apiStatus.gemini.configured ? (
                    <p className="text-xs text-oa-text-secondary">Model: {apiStatus.gemini.imageModel}</p>
                  ) : (
                    <a href={apiStatus.gemini.getKeyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-oa-accent hover:underline">
                      Get API Key at Google AI Studio →
                    </a>
                  )}
                  {apiStatus.gemini.usedBy && (
                    <p className="text-xs text-oa-text-secondary mt-1">Used by: {apiStatus.gemini.usedBy.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* Optional: Brave API */}
              <div className="p-4 bg-oa-bg-tertiary rounded-lg border border-oa-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {apiStatus.brave.configured ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-500/50" />
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-oa-text-primary">Brave Search API</h4>
                      <p className="text-xs text-oa-text-secondary">{apiStatus.brave.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${apiStatus.brave.configured ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                    {apiStatus.brave.configured ? 'Connected' : 'Not configured'}
                  </span>
                </div>
                {!apiStatus.brave.configured && (
                  <a href={apiStatus.brave.getKeyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-oa-accent hover:underline ml-8">
                    Get API Key at Brave Search →
                  </a>
                )}
              </div>

              {/* Optional: Perplexity API */}
              <div className="p-4 bg-oa-bg-tertiary rounded-lg border border-oa-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {apiStatus.perplexity.configured ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-500/50" />
                    )}
                    <div>
                      <h4 className="text-sm font-medium text-oa-text-primary">Perplexity API</h4>
                      <p className="text-xs text-oa-text-secondary">{apiStatus.perplexity.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${apiStatus.perplexity.configured ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                    {apiStatus.perplexity.configured ? 'Connected' : 'Not configured'}
                  </span>
                </div>
                {!apiStatus.perplexity.configured && (
                  <a href={apiStatus.perplexity.getKeyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-oa-accent hover:underline ml-8">
                    Get API Key at Perplexity →
                  </a>
                )}
              </div>

              <div className="mt-4 p-3 bg-oa-bg-tertiary rounded-lg">
                <p className="text-xs text-oa-text-secondary">
                  <strong>How to add API keys:</strong> Create or edit <code className="bg-oa-bg-primary px-1 py-0.5 rounded">ui/.env.local</code> and add your keys:
                </p>
                <pre className="mt-2 text-xs bg-oa-bg-primary p-2 rounded overflow-x-auto text-oa-text-secondary">
{`# Required
OPENANALYST_API_KEY=sk-oa-v1-xxx
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_MODEL=openanalyst-beta

# Optional - Image Generation
GEMINI_API_KEY=xxx

# Optional - Search
BRAVE_API_KEY=xxx
PERPLEXITY_API_KEY=xxx`}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-sm text-oa-text-secondary">Loading API status...</p>
          )}
        </Section>

        {/* API Keys Section */}
        <Section
          title="API Keys"
          subtitle="Manage your API keys for AI services"
          icon={<Key className="w-5 h-5" />}
          isExpanded={expandedSections.apiKeys}
          onToggle={() => toggleSection('apiKeys')}
        >
          <Suspense fallback={<SectionLoader />}>
            <APIKeyManager />
          </Suspense>
        </Section>

        {/* Data Storage Section */}
        <Section
          title="Data Storage"
          subtitle="Toggle between local and cloud storage"
          icon={<Database className="w-5 h-5" />}
          isExpanded={expandedSections.dataStorage}
          onToggle={() => toggleSection('dataStorage')}
        >
          <Suspense fallback={<SectionLoader />}>
            <DataSourceToggle />
          </Suspense>
        </Section>

        {/* MCP Integration Section */}
        <Section
          title="MCP Integration"
          subtitle="Configure Model Context Protocol servers"
          icon={<Server className="w-5 h-5" />}
          isExpanded={expandedSections.mcp}
          onToggle={() => toggleSection('mcp')}
        >
          <Suspense fallback={<SectionLoader />}>
            <MCPManager />
          </Suspense>
        </Section>

        {/* Agent Settings Section */}
        <Section
          title="Agent Settings"
          subtitle="Configure skills, prompts, and behavior for each agent"
          icon={<Bot className="w-5 h-5" />}
          isExpanded={expandedSections.agentSettings}
          onToggle={() => toggleSection('agentSettings')}
        >
          <Suspense fallback={<SectionLoader />}>
            <AgentSettings />
          </Suspense>
        </Section>

        {/* Profile Section */}
        <Section
          title="Profile"
          icon={<User className="w-5 h-5" />}
          isExpanded={expandedSections.profile}
          onToggle={() => toggleSection('profile')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-4 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Timezone
              </label>
              <input
                type="text"
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-4 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
                placeholder="America/New_York"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </Section>

        {/* Profile Management Section */}
        <Section
          title="Profile Management"
          icon={<User className="w-5 h-5" />}
          isExpanded={expandedSections.profileManagement || false}
          onToggle={() => toggleSection('profileManagement')}
        >
          <div className="space-y-4">
            <div className="bg-oa-bg-secondary p-4 rounded-lg border border-oa-border">
              <p className="text-sm text-oa-text-secondary mb-4">
                Switch between profiles or manage existing profiles. Each profile has its own challenges, todos, and workspace.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/profiles'}
                  className="px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
                >
                  Switch Profile
                </button>
                <button
                  onClick={() => window.location.href = '/onboarding'}
                  className="px-6 py-2 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-tertiary transition-colors"
                >
                  Create New Profile
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* All Profiles Section */}
        <Section
          title="All Profiles"
          subtitle="View and switch between all available profiles"
          icon={<Users className="w-5 h-5" />}
          isExpanded={expandedSections.profiles}
          onToggle={() => toggleSection('profiles')}
        >
          {allProfiles.length > 0 ? (
            <div className="space-y-3">
              {allProfiles.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    activeProfileId === p.id
                      ? 'bg-oa-accent/10 border-oa-accent'
                      : 'bg-oa-bg-tertiary border-oa-border hover:border-oa-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activeProfileId === p.id ? 'bg-oa-accent' : 'bg-oa-bg-secondary'
                    }`}>
                      <User className={`w-5 h-5 ${activeProfileId === p.id ? 'text-white' : 'text-oa-text-secondary'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-oa-text-primary">{p.name}</h4>
                        {p.owner && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">Owner</span>
                        )}
                        {activeProfileId === p.id && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-oa-text-secondary">{p.email}</p>
                      <p className="text-xs text-oa-text-secondary mt-0.5">Created: {p.created || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeProfileId === p.id ? (
                      <div className="flex items-center gap-1.5 text-green-500">
                        <Check className="w-4 h-4" />
                        <span className="text-xs">Current</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          localStorage.setItem('activeProfileId', p.id)
                          window.location.reload()
                        }}
                        className="px-4 py-1.5 text-xs bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-oa-text-secondary mb-4">No profiles found</p>
              <button
                onClick={() => window.location.href = '/onboarding'}
                className="px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
              >
                Create Your First Profile
              </button>
            </div>
          )}
        </Section>

        {/* Onboarding Data (Read-only) */}
        <Section
          title="Onboarding Data"
          subtitle="Information you provided during initial setup"
          icon={<FileText className="w-5 h-5" />}
          isExpanded={expandedSections.onboarding}
          onToggle={() => toggleSection('onboarding')}
        >
          {onboardingData && !onboardingData.error ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-semibold text-oa-text-primary mb-3">Profile Information</h4>
                <div className="space-y-2 bg-oa-bg-tertiary p-4 rounded-lg">
                  <DataField label="Name" value={onboardingData.name || 'Not set'} />
                  <DataField label="Email" value={onboardingData.email || 'Not set'} />
                  <DataField label="Timezone" value={onboardingData.timezone || 'Not set'} />
                  <DataField label="Profile ID" value={onboardingData.profileId || 'Not set'} />
                  <DataField label="Created" value={onboardingData.createdAt || 'Not set'} />
                </div>
              </div>

              {/* Goals & Motivation */}
              <div>
                <h4 className="text-sm font-semibold text-oa-text-primary mb-3">Goals & Motivation</h4>
                <div className="space-y-2 bg-oa-bg-tertiary p-4 rounded-lg">
                  <DataField label="Big Goal" value={onboardingData.bigGoal || 'Not set'} />
                  <DataField label="New Year Resolution" value={onboardingData.resolution || 'Not set'} />
                  <DataField label="Motivation Style" value={onboardingData.motivation || 'Not set'} />
                </div>
              </div>

              {/* Schedule & Availability */}
              <div>
                <h4 className="text-sm font-semibold text-oa-text-primary mb-3">Schedule & Availability</h4>
                <div className="space-y-2 bg-oa-bg-tertiary p-4 rounded-lg">
                  <DataField label="Productive Time" value={onboardingData.productiveTime || 'Not set'} />
                  <DataField label="Daily Hours Available" value={onboardingData.dailyHours || onboardingData.daily_hours || 'Not set'} />
                  <DataField
                    label="Available Days"
                    value={
                      Array.isArray(onboardingData.availableDays) && onboardingData.availableDays.length > 0
                        ? onboardingData.availableDays.join(', ')
                        : 'All days'
                    }
                  />
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h4 className="text-sm font-semibold text-oa-text-primary mb-3">Accountability Preferences</h4>
                <div className="space-y-2 bg-oa-bg-tertiary p-4 rounded-lg">
                  <DataField label="Accountability Style" value={onboardingData.accountabilityStyle || onboardingData.persona || 'Not set'} />
                  {onboardingData.preferences && (
                    <>
                      <DataField label="Check-in Frequency" value={onboardingData.preferences.checkInFrequency || 'Daily'} />
                      <DataField label="Reminder Tone" value={onboardingData.preferences.reminderTone || 'Not set'} />
                      <DataField label="Daily Check-in Time" value={onboardingData.preferences.dailyCheckinTime || 'Not set'} />
                      <DataField label="Streak Alerts" value={onboardingData.preferences.streakAlerts ? 'Enabled' : 'Disabled'} />
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => window.location.href = '/onboarding'}
                  className="flex items-center gap-2 text-sm text-oa-accent hover:text-oa-accent-hover"
                >
                  <Edit2 className="w-4 h-4" />
                  Re-run Onboarding
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-oa-text-secondary mb-4">No onboarding data found for this profile</p>
              <button
                onClick={() => window.location.href = '/onboarding'}
                className="px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors"
              >
                Complete Onboarding
              </button>
            </div>
          )}
        </Section>

        {/* Availability */}
        <Section
          title="Availability & Schedule"
          subtitle="Your daily schedule and focus hours"
          icon={<Clock className="w-5 h-5" />}
          isExpanded={expandedSections.availability}
          onToggle={() => toggleSection('availability')}
        >
          {availability ? (
            <div className="space-y-3">
              <DataField label="Focus Hours" value={availability.focusHours || 'Not set'} />
              <DataField label="Available Days" value={availability.availableDays?.join(', ') || 'All days'} />
              <button
                onClick={() => alert('Manage availability via chat or Schedule page')}
                className="text-sm text-oa-accent hover:text-oa-accent-hover"
              >
                Edit Availability →
              </button>
            </div>
          ) : (
            <p className="text-sm text-oa-text-secondary">No availability data found</p>
          )}
        </Section>

        {/* Accountability Contracts */}
        <Section
          title="Accountability Contracts"
          subtitle="Your commitments and consequences"
          icon={<Shield className="w-5 h-5" />}
          isExpanded={expandedSections.contracts}
          onToggle={() => toggleSection('contracts')}
        >
          <a
            href="/contracts"
            className="flex items-center justify-between p-4 bg-oa-bg-tertiary border border-oa-border rounded-lg hover:border-oa-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-oa-accent" />
              <div>
                <h4 className="text-sm font-medium text-oa-text-primary">Manage Contracts</h4>
                <p className="text-xs text-oa-text-secondary">
                  {contracts.length > 0 ? `${contracts.length} active contract${contracts.length !== 1 ? 's' : ''}` : 'Create your first contract'}
                </p>
              </div>
            </div>
            <span className="text-oa-text-secondary">→</span>
          </a>
        </Section>

        {/* Preferences */}
        <Section
          title="Preferences"
          subtitle="Customize your experience"
          icon={<FileText className="w-5 h-5" />}
          isExpanded={expandedSections.preferences}
          onToggle={() => toggleSection('preferences')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-oa-text-primary mb-2">
                Accountability Style
              </label>
              <select
                value={preferences.accountabilityStyle}
                onChange={(e) => setPreferences({ ...preferences, accountabilityStyle: e.target.value })}
                className="w-full px-4 py-2 bg-oa-bg-tertiary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:ring-2 focus:ring-oa-accent"
              >
                <option value="">Select style</option>
                <option value="strict">Strict - No excuses</option>
                <option value="balanced">Balanced - Firm but fair</option>
                <option value="friendly">Friendly - Gentle encouragement</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-oa-text-primary">Enable Notifications</span>
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-oa-text-primary">Enable Reminders</span>
              <input
                type="checkbox"
                checked={preferences.reminders}
                onChange={(e) => setPreferences({ ...preferences, reminders: e.target.checked })}
                className="w-5 h-5"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-6 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent-hover transition-colors disabled:opacity-50"
            >
              Save Preferences
            </button>
          </div>
        </Section>

        {/* Help & Documentation */}
        <Section
          title="Help & Documentation"
          subtitle="Guides, tutorials, and support resources"
          icon={<HelpCircle className="w-5 h-5" />}
          isExpanded={expandedSections.help}
          onToggle={() => toggleSection('help')}
        >
          <a
            href="/help"
            className="flex items-center justify-between p-4 bg-oa-bg-tertiary border border-oa-border rounded-lg hover:border-oa-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-oa-accent" />
              <div>
                <h4 className="text-sm font-medium text-oa-text-primary">View Help & Documentation</h4>
                <p className="text-xs text-oa-text-secondary">Complete guides and tutorials</p>
              </div>
            </div>
            <span className="text-oa-text-secondary">→</span>
          </a>
        </Section>

        {/* Data & Privacy */}
        <Section
          title="Data & Privacy"
          subtitle="Manage your data and privacy settings"
          icon={<Shield className="w-5 h-5" />}
          isExpanded={expandedSections.privacy}
          onToggle={() => toggleSection('privacy')}
        >
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-oa-border text-oa-text-primary rounded-lg hover:bg-oa-bg-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All Data
            </button>
            <button
              onClick={handleClearHistory}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat History
            </button>
            <button
              onClick={handleResetApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Reset App (Delete All Data)
            </button>
            <p className="text-xs text-oa-text-secondary mt-4">
              All your data is stored locally in <code className="bg-oa-bg-tertiary px-1 py-0.5 rounded">data/</code>
            </p>
          </div>
        </Section>
      </div>
    </div>
  )
}

// Collapsible Section Component with animations
interface SectionProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function Section({ title, subtitle, icon, isExpanded, onToggle, children }: SectionProps) {
  return (
    <motion.div
      className="mb-4 bg-oa-bg-secondary border border-oa-border rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-oa-bg-tertiary transition-colors"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="text-oa-accent"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-oa-text-primary">{title}</h2>
            {subtitle && <p className="text-xs text-oa-text-secondary mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-oa-text-secondary" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-oa-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Data Field Component (Read-only display)
interface DataFieldProps {
  label: string
  value: string
}

function DataField({ label, value }: DataFieldProps) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-oa-border last:border-0">
      <span className="text-sm font-medium text-oa-text-secondary">{label}</span>
      <span className="text-sm text-oa-text-primary text-right max-w-md">{value}</span>
    </div>
  )
}
