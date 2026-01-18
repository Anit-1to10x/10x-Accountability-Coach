'use client'

import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Clock, Shield, FileText, Download, Trash2, ChevronDown, ChevronRight, Edit2, HelpCircle, BookOpen, Zap, CheckCircle, XCircle, Database, Server, Loader2 } from 'lucide-react'

// Lazy load heavy components
const DataSourceToggle = lazy(() => import('@/components/settings/DataSourceToggle').then(mod => ({ default: mod.DataSourceToggle })))
const MCPManager = lazy(() => import('@/components/settings/MCPManager').then(mod => ({ default: mod.MCPManager })))

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
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    timezone: '',
    photo: '',
  })
  const [onboardingData, setOnboardingData] = useState<any>(null)
  const [availability, setAvailability] = useState<any>(null)
  const [contracts, setContracts] = useState<any[]>([])
  const [preferences, setPreferences] = useState({
    accountabilityStyle: '',
    notifications: true,
    reminders: true,
    language: 'en',
    theme: 'dark',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [apiStatus, setApiStatus] = useState<{
    openanalyst: { configured: boolean; url: string; model: string }
    gemini: { configured: boolean; model: string; imageModel: string }
  } | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    apiStatus: true,
    dataStorage: false,
    mcp: false,
    profile: true,
    onboarding: false,
    availability: false,
    contracts: false,
    preferences: false,
    help: false,
    privacy: false,
  })

  useEffect(() => {
    loadAllData()
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
      const activeProfileId = typeof window !== 'undefined' ? localStorage.getItem('activeProfileId') : null

      // Load profile using status API with profileId
      const profileRes = await fetch(`/api/user/status${activeProfileId ? `?profileId=${activeProfileId}` : ''}`)
      const profileData = await profileRes.json()
      if (profileData.user) {
        setProfile({
          name: profileData.user.name || '',
          email: profileData.user.email || '',
          timezone: profileData.user.timezone || '',
          photo: '',
        })
      }

      // Load onboarding data
      const onboardingRes = await fetch('/api/user/onboarding')
      const onboardingData = await onboardingRes.json()
      setOnboardingData(onboardingData)

      // Load availability
      const availRes = await fetch('/api/user/availability')
      const availData = await availRes.json()
      setAvailability(availData)

      // Load contracts
      const contractsRes = await fetch('/api/contracts')
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
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, preferences }),
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
              {/* OpenAnalyst API */}
              <div className="flex items-center justify-between p-4 bg-oa-bg-tertiary rounded-lg border border-oa-border">
                <div className="flex items-center gap-3">
                  {apiStatus.openanalyst.configured ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-oa-text-primary">OpenAnalyst API (Chat)</h4>
                    <p className="text-xs text-oa-text-secondary">
                      {apiStatus.openanalyst.configured ? `Connected - Model: ${apiStatus.openanalyst.model}` : 'Not configured - Add OPENANALYST_API_KEY to .env.local'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${apiStatus.openanalyst.configured ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {apiStatus.openanalyst.configured ? 'Connected' : 'Missing'}
                </span>
              </div>

              {/* Gemini API */}
              <div className="flex items-center justify-between p-4 bg-oa-bg-tertiary rounded-lg border border-oa-border">
                <div className="flex items-center gap-3">
                  {apiStatus.gemini.configured ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-oa-text-primary">Gemini API (Image Generation)</h4>
                    <p className="text-xs text-oa-text-secondary">
                      {apiStatus.gemini.configured ? `Connected - Model: ${apiStatus.gemini.imageModel}` : 'Optional - Add GEMINI_API_KEY to .env.local for image features'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${apiStatus.gemini.configured ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  {apiStatus.gemini.configured ? 'Connected' : 'Optional'}
                </span>
              </div>

              <p className="text-xs text-oa-text-secondary mt-2">
                API keys are stored in <code className="bg-oa-bg-tertiary px-1 py-0.5 rounded">ui/.env.local</code>
              </p>
            </div>
          ) : (
            <p className="text-sm text-oa-text-secondary">Loading API status...</p>
          )}
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

        {/* Onboarding Data (Read-only) */}
        <Section
          title="Onboarding Data"
          subtitle="Information you provided during initial setup (read-only)"
          icon={<FileText className="w-5 h-5" />}
          isExpanded={expandedSections.onboarding}
          onToggle={() => toggleSection('onboarding')}
        >
          {onboardingData ? (
            <div className="space-y-3">
              <DataField label="Persona" value={onboardingData.persona || 'Not set'} />
              <DataField label="New Year Resolution" value={onboardingData.resolution || 'Not set'} />
              <DataField label="Daily Hours Available" value={onboardingData.daily_hours || 'Not set'} />
              <DataField
                label="Preferred Time Slots"
                value={
                  Array.isArray(onboardingData.available_slots)
                    ? onboardingData.available_slots.join(', ')
                    : 'Not set'
                }
              />
              <DataField
                label="Onboarding Completed"
                value={
                  onboardingData.completedAt
                    ? new Date(onboardingData.completedAt).toLocaleString()
                    : 'Not completed'
                }
              />
              <button
                onClick={() => alert('Edit via chat: Ask your accountability coach to update your preferences')}
                className="flex items-center gap-2 text-sm text-oa-accent hover:text-oa-accent-hover mt-4"
              >
                <Edit2 className="w-4 h-4" />
                Request Changes (via Claude Code)
              </button>
            </div>
          ) : (
            <p className="text-sm text-oa-text-secondary">No onboarding data found</p>
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
