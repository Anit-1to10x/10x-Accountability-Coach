'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Download, Link, Plus, Sparkles, Package, Check, Loader2, ExternalLink, Upload, FileText, FolderArchive } from 'lucide-react'

interface OfficialSkill {
  id: string
  name: string
  description: string
  category: string
  author: string
  source: string
}

interface SkillImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}

type Tab = 'browse' | 'import' | 'create'

export function SkillImportModal({ isOpen, onClose, onImported }: SkillImportModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('browse')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Browse tab state
  const [officialSkills, setOfficialSkills] = useState<OfficialSkill[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [importingSkillId, setImportingSkillId] = useState<string | null>(null)

  // Import tab state
  const [importUrl, setImportUrl] = useState('')
  const [importContent, setImportContent] = useState('')
  const [importMode, setImportMode] = useState<'url' | 'paste' | 'file'>('file')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create tab state
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    category: 'custom' as 'productivity' | 'health' | 'learning' | 'creative' | 'custom',
    triggers: '',
    instructions: '',
  })

  useEffect(() => {
    if (isOpen && activeTab === 'browse') {
      loadOfficialCatalog()
    }
  }, [isOpen, activeTab])

  const loadOfficialCatalog = async () => {
    setLoadingCatalog(true)
    try {
      const res = await fetch('/api/skills/import')
      const data = await res.json()
      setOfficialSkills(data.catalog || [])
    } catch (err) {
      console.error('Failed to load catalog:', err)
    } finally {
      setLoadingCatalog(false)
    }
  }

  const handleImportOfficial = async (skill: OfficialSkill) => {
    setImportingSkillId(skill.id)
    setError(null)
    try {
      const res = await fetch('/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'official',
          skillId: skill.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setSuccess(`Imported "${skill.name}" successfully!`)
      setTimeout(() => {
        onImported()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImportingSkillId(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const mdFiles = files.filter(f => f.name.endsWith('.md'))
    setSelectedFiles(mdFiles)
    if (files.length > mdFiles.length) {
      setError(`${files.length - mdFiles.length} non-.md file(s) were skipped. Only SKILL.md files are supported.`)
    } else {
      setError(null)
    }
  }

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const res = await fetch('/api/skills/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      if (data.imported > 0) {
        setSuccess(`Imported ${data.imported} skill${data.imported > 1 ? 's' : ''} successfully!`)
        setTimeout(() => {
          onImported()
          onClose()
        }, 1500)
      } else {
        throw new Error('No skills were imported')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportFromSource = async () => {
    if (importMode === 'file') {
      return handleFileUpload()
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: importMode === 'url' ? 'url' : 'content',
          url: importMode === 'url' ? importUrl : undefined,
          content: importMode === 'paste' ? importContent : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setSuccess(`Imported "${data.skill.name}" successfully!`)
      setTimeout(() => {
        onImported()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSkill = async () => {
    if (!newSkill.name || !newSkill.description || !newSkill.instructions) {
      setError('Name, description, and instructions are required')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/skills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSkill.name,
          description: newSkill.description,
          category: newSkill.category,
          triggers: newSkill.triggers.split(',').map(t => t.trim()).filter(Boolean),
          instructions: newSkill.instructions,
          createdByAgentId: 'user-created',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Creation failed')
      }

      setSuccess(`Created "${newSkill.name}" successfully!`)
      setTimeout(() => {
        onImported()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-oa-bg-primary border border-oa-border rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-oa-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-oa-accent/10 rounded-lg">
              <Package className="w-5 h-5 text-oa-accent" />
            </div>
            <h2 className="text-xl font-semibold text-oa-text-primary">Add Skills</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-oa-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-oa-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-oa-border">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'browse'
                ? 'text-oa-accent border-b-2 border-oa-accent bg-oa-accent/5'
                : 'text-oa-text-secondary hover:text-oa-text-primary hover:bg-oa-bg-secondary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Browse Official
            </div>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-oa-accent border-b-2 border-oa-accent bg-oa-accent/5'
                : 'text-oa-text-secondary hover:text-oa-text-primary hover:bg-oa-bg-secondary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Import
            </div>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'text-oa-accent border-b-2 border-oa-accent bg-oa-accent/5'
                : 'text-oa-text-secondary hover:text-oa-text-primary hover:bg-oa-bg-secondary'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Create New
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* Browse Tab */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              <p className="text-sm text-oa-text-secondary mb-4">
                One-click install popular Claude skills. These skills are community-tested and ready to use.
              </p>

              {loadingCatalog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-oa-accent animate-spin" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {officialSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between p-4 bg-oa-bg-secondary border border-oa-border rounded-lg hover:border-oa-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-oa-text-primary">{skill.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-oa-accent/10 text-oa-accent rounded-full">
                            {skill.category}
                          </span>
                        </div>
                        <p className="text-sm text-oa-text-secondary">{skill.description}</p>
                      </div>
                      <button
                        onClick={() => handleImportOfficial(skill)}
                        disabled={importingSkillId === skill.id}
                        className="flex items-center gap-2 px-4 py-2 bg-oa-accent text-white rounded-lg hover:bg-oa-accent/90 transition-colors disabled:opacity-50"
                      >
                        {importingSkillId === skill.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Install
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 p-4 bg-oa-bg-secondary/50 border border-oa-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-oa-text-secondary" />
                  <span className="text-sm font-medium text-oa-text-primary">More Skills</span>
                </div>
                <p className="text-xs text-oa-text-secondary">
                  Find more skills at the official Claude Skills repository or create your own.
                </p>
              </div>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <p className="text-sm text-oa-text-secondary">
                Upload SKILL.md files, import from URL, or paste content directly.
              </p>

              {/* Import Mode Toggle */}
              <div className="flex border border-oa-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setImportMode('file')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    importMode === 'file'
                      ? 'bg-oa-accent text-white'
                      : 'bg-oa-bg-secondary text-oa-text-secondary hover:text-oa-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload File
                  </div>
                </button>
                <button
                  onClick={() => setImportMode('url')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    importMode === 'url'
                      ? 'bg-oa-accent text-white'
                      : 'bg-oa-bg-secondary text-oa-text-secondary hover:text-oa-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Link className="w-4 h-4" />
                    From URL
                  </div>
                </button>
                <button
                  onClick={() => setImportMode('paste')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    importMode === 'paste'
                      ? 'bg-oa-accent text-white'
                      : 'bg-oa-bg-secondary text-oa-text-secondary hover:text-oa-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Package className="w-4 h-4" />
                    Paste Content
                  </div>
                </button>
              </div>

              {importMode === 'file' ? (
                <div className="space-y-4">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-oa-border hover:border-oa-accent rounded-lg p-8 text-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-10 h-10 mx-auto text-oa-text-secondary mb-3" />
                    <p className="text-sm font-medium text-oa-text-primary mb-1">
                      Click to upload SKILL.md files
                    </p>
                    <p className="text-xs text-oa-text-secondary">
                      You can select multiple .md files at once
                    </p>
                  </div>

                  {/* Selected files */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-oa-text-primary">
                        Selected Files ({selectedFiles.length})
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-oa-bg-secondary rounded-lg text-sm">
                            <FileText className="w-4 h-4 text-oa-accent" />
                            <span className="text-oa-text-primary">{file.name}</span>
                            <span className="text-xs text-oa-text-secondary ml-auto">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bulk import tip */}
                  <div className="p-3 bg-oa-bg-secondary/50 border border-oa-border rounded-lg">
                    <div className="flex items-start gap-2">
                      <FolderArchive className="w-4 h-4 text-oa-text-secondary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-oa-text-primary">Bulk Import</p>
                        <p className="text-xs text-oa-text-secondary">
                          For many skills, extract your ZIP to the <code className="bg-oa-bg-tertiary px-1 rounded">skills/</code> folder and restart.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : importMode === 'url' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-oa-text-primary mb-2">
                      Skill URL
                    </label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://github.com/user/repo/blob/main/skill.md"
                      className="w-full px-4 py-3 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder-oa-text-secondary/50 focus:outline-none focus:border-oa-accent"
                    />
                    <p className="mt-2 text-xs text-oa-text-secondary">
                      Paste a raw URL to a .md skill file (GitHub raw URLs work best)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-oa-text-primary mb-2">
                      Skill Content (Markdown)
                    </label>
                    <textarea
                      value={importContent}
                      onChange={(e) => setImportContent(e.target.value)}
                      placeholder={`---
name: my-skill
description: What this skill does
---

# My Skill

Instructions for the skill...`}
                      rows={12}
                      className="w-full px-4 py-3 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder-oa-text-secondary/50 focus:outline-none focus:border-oa-accent font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleImportFromSource}
                disabled={isLoading || (importMode === 'file' ? selectedFiles.length === 0 : importMode === 'url' ? !importUrl : !importContent)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                {importMode === 'file' ? `Import ${selectedFiles.length} Skill${selectedFiles.length !== 1 ? 's' : ''}` : 'Import Skill'}
              </button>
            </div>
          )}

          {/* Create Tab */}
          {activeTab === 'create' && (
            <div className="space-y-5">
              <p className="text-sm text-oa-text-secondary">
                Create a new custom skill from scratch.
              </p>

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Skill Name *
                </label>
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  placeholder="My Custom Skill"
                  className="w-full px-4 py-2.5 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder-oa-text-secondary/50 focus:outline-none focus:border-oa-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="What does this skill do?"
                  className="w-full px-4 py-2.5 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder-oa-text-secondary/50 focus:outline-none focus:border-oa-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-oa-text-primary mb-2">
                    Category
                  </label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:border-oa-accent"
                  >
                    <option value="productivity">Productivity</option>
                    <option value="health">Health</option>
                    <option value="learning">Learning</option>
                    <option value="creative">Creative</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-oa-text-primary mb-2">
                    Triggers (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newSkill.triggers}
                    onChange={(e) => setNewSkill({ ...newSkill, triggers: e.target.value })}
                    placeholder="help me, assist with"
                    className="w-full px-4 py-2.5 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder-oa-text-secondary/50 focus:outline-none focus:border-oa-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Instructions *
                </label>
                <textarea
                  value={newSkill.instructions}
                  onChange={(e) => setNewSkill({ ...newSkill, instructions: e.target.value })}
                  placeholder="Detailed instructions for what the skill should do, how it should behave, and any specific formatting..."
                  rows={8}
                  className="w-full px-4 py-3 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary placeholder-oa-text-secondary/50 focus:outline-none focus:border-oa-accent"
                />
              </div>

              <button
                onClick={handleCreateSkill}
                disabled={isLoading || !newSkill.name || !newSkill.description || !newSkill.instructions}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Create Skill
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
