'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Server,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Settings2,
  Check,
  X,
  Loader2,
  Database,
  Github,
  MessageSquare,
  FileText,
  Search,
  Brain,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Zap,
  RefreshCw
} from 'lucide-react'
import type { MCPServer } from '@/types/mcp'
import { MCP_PRESETS } from '@/types/mcp'

interface MCPManagerProps {
  onClose?: () => void
}

export function MCPManager({ onClose }: MCPManagerProps) {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mcpEnabled, setMcpEnabled] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [togglingServer, setTogglingServer] = useState<string | null>(null)
  const [deletingServer, setDeletingServer] = useState<string | null>(null)
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/mcp')
      const data = await res.json()
      setServers(data.servers || [])
      setMcpEnabled(data.enabled)
    } catch (error) {
      console.error('Failed to load MCP servers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMCPEnabled = async () => {
    try {
      const res = await fetch('/api/mcp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !mcpEnabled }),
      })
      if (res.ok) {
        setMcpEnabled(!mcpEnabled)
      }
    } catch (error) {
      console.error('Failed to toggle MCP:', error)
    }
  }

  const toggleServer = async (serverId: string, currentEnabled: boolean) => {
    try {
      setTogglingServer(serverId)
      const res = await fetch(`/api/mcp/${serverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      })
      if (res.ok) {
        setServers(servers.map(s =>
          s.id === serverId ? { ...s, enabled: !currentEnabled } : s
        ))
      }
    } catch (error) {
      console.error('Failed to toggle server:', error)
    } finally {
      setTogglingServer(null)
    }
  }

  const deleteServer = async (serverId: string) => {
    try {
      setDeletingServer(serverId)
      const res = await fetch(`/api/mcp/${serverId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setServers(servers.filter(s => s.id !== serverId))
      }
    } catch (error) {
      console.error('Failed to delete server:', error)
    } finally {
      setDeletingServer(null)
    }
  }

  const addServer = async (server: Partial<MCPServer>) => {
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server),
      })
      if (res.ok) {
        const data = await res.json()
        setServers([...servers, data.server])
        setShowAddModal(false)
      }
    } catch (error) {
      console.error('Failed to add server:', error)
    }
  }

  const getServerIcon = (server: MCPServer) => {
    const iconMap: Record<string, any> = {
      supabase: Database,
      github: Github,
      slack: MessageSquare,
      notion: FileText,
      'brave-search': Search,
      memory: Brain,
      filesystem: FileText,
      postgres: Database,
    }
    const Icon = iconMap[server.id] || Server
    return <Icon className="w-5 h-5" />
  }

  const toggleExpanded = (serverId: string) => {
    const newExpanded = new Set(expandedServers)
    if (newExpanded.has(serverId)) {
      newExpanded.delete(serverId)
    } else {
      newExpanded.add(serverId)
    }
    setExpandedServers(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-oa-accent" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Global Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-oa-text-primary">MCP Servers</h3>
            <p className="text-xs text-oa-text-secondary">
              Extend AI capabilities with external tools
            </p>
          </div>
        </div>

        {/* Global Toggle */}
        <motion.button
          onClick={toggleMCPEnabled}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            mcpEnabled ? 'bg-oa-accent' : 'bg-oa-bg-tertiary'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
            animate={{ left: mcpEnabled ? '32px' : '4px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {mcpEnabled ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Server List */}
            {servers.length > 0 ? (
              <div className="space-y-3">
                {servers.map((server, index) => (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-oa-bg-secondary border rounded-xl overflow-hidden transition-all ${
                      server.enabled ? 'border-oa-accent/30' : 'border-oa-border'
                    }`}
                  >
                    {/* Server Header */}
                    <div className="flex items-center gap-3 p-4">
                      <button
                        onClick={() => toggleExpanded(server.id)}
                        className="text-oa-text-secondary hover:text-oa-text-primary"
                      >
                        {expandedServers.has(server.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className={`p-2 rounded-lg ${
                        server.enabled ? 'bg-oa-accent/10 text-oa-accent' : 'bg-oa-bg-tertiary text-oa-text-secondary'
                      }`}>
                        {getServerIcon(server)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-oa-text-primary truncate">
                            {server.name}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            server.enabled
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-oa-bg-tertiary text-oa-text-secondary'
                          }`}>
                            {server.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs text-oa-text-secondary truncate">
                          {server.description || server.type}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => toggleServer(server.id, server.enabled)}
                          disabled={togglingServer === server.id}
                          className={`p-2 rounded-lg transition-colors ${
                            server.enabled
                              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              : 'bg-oa-bg-tertiary text-oa-text-secondary hover:text-oa-text-primary'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {togglingServer === server.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : server.enabled ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </motion.button>

                        <motion.button
                          onClick={() => deleteServer(server.id)}
                          disabled={deletingServer === server.id}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {deletingServer === server.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedServers.has(server.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-oa-border"
                        >
                          <div className="p-4 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-oa-text-secondary">Type:</span>
                              <code className="px-2 py-0.5 bg-oa-bg-tertiary rounded text-oa-text-primary">
                                {server.type}
                              </code>
                            </div>
                            {server.command && (
                              <div className="flex items-center gap-2">
                                <span className="text-oa-text-secondary">Command:</span>
                                <code className="px-2 py-0.5 bg-oa-bg-tertiary rounded text-oa-text-primary">
                                  {server.command} {server.args?.join(' ')}
                                </code>
                              </div>
                            )}
                            {server.url && (
                              <div className="flex items-center gap-2">
                                <span className="text-oa-text-secondary">URL:</span>
                                <code className="px-2 py-0.5 bg-oa-bg-tertiary rounded text-oa-text-primary">
                                  {server.url}
                                </code>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-oa-bg-secondary flex items-center justify-center">
                  <Server className="w-8 h-8 text-oa-text-secondary" />
                </div>
                <p className="text-oa-text-secondary mb-4">No MCP servers configured</p>
              </motion.div>
            )}

            {/* Add Server Button */}
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-oa-bg-secondary border border-dashed border-oa-border rounded-xl text-oa-text-secondary hover:text-oa-accent hover:border-oa-accent transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Plus className="w-5 h-5" />
              Add MCP Server
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-oa-text-secondary"
          >
            <p>MCP is disabled. Toggle on to manage servers.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Server Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddServerModal
            onClose={() => setShowAddModal(false)}
            onAdd={addServer}
            existingIds={servers.map(s => s.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Add Server Modal Component
function AddServerModal({
  onClose,
  onAdd,
  existingIds,
}: {
  onClose: () => void
  onAdd: (server: Partial<MCPServer>) => void
  existingIds: string[]
}) {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets')
  const [customServer, setCustomServer] = useState({
    name: '',
    type: 'stdio' as 'stdio' | 'http' | 'sse',
    command: '',
    args: '',
    url: '',
    description: '',
  })
  const [isAdding, setIsAdding] = useState(false)

  const availablePresets = MCP_PRESETS.filter(p => !existingIds.includes(p.id!))

  const handleAddPreset = async (preset: Partial<MCPServer>) => {
    setIsAdding(true)
    await onAdd({
      ...preset,
      enabled: true,
      status: 'pending',
    })
    setIsAdding(false)
  }

  const handleAddCustom = async () => {
    if (!customServer.name) return

    setIsAdding(true)
    await onAdd({
      name: customServer.name,
      type: customServer.type,
      command: customServer.type === 'stdio' ? customServer.command : undefined,
      args: customServer.type === 'stdio' ? customServer.args.split(' ').filter(Boolean) : undefined,
      url: customServer.type !== 'stdio' ? customServer.url : undefined,
      description: customServer.description,
      enabled: true,
      status: 'pending',
    })
    setIsAdding(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-oa-bg-primary border border-oa-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-oa-border">
          <h2 className="text-lg font-semibold text-oa-text-primary">Add MCP Server</h2>
          <button onClick={onClose} className="p-2 hover:bg-oa-bg-secondary rounded-lg">
            <X className="w-5 h-5 text-oa-text-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-oa-border">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'presets'
                ? 'text-oa-accent border-b-2 border-oa-accent'
                : 'text-oa-text-secondary hover:text-oa-text-primary'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'custom'
                ? 'text-oa-accent border-b-2 border-oa-accent'
                : 'text-oa-text-secondary hover:text-oa-text-primary'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === 'presets' ? (
            <div className="space-y-2">
              {availablePresets.length > 0 ? (
                availablePresets.map((preset) => (
                  <motion.button
                    key={preset.id}
                    onClick={() => handleAddPreset(preset)}
                    disabled={isAdding}
                    className="w-full flex items-center gap-3 p-3 bg-oa-bg-secondary hover:bg-oa-bg-tertiary border border-oa-border rounded-lg transition-colors text-left"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="p-2 bg-oa-accent/10 rounded-lg">
                      <Server className="w-4 h-4 text-oa-accent" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-oa-text-primary">{preset.name}</h4>
                      <p className="text-xs text-oa-text-secondary">{preset.description}</p>
                    </div>
                    <Plus className="w-4 h-4 text-oa-text-secondary" />
                  </motion.button>
                ))
              ) : (
                <p className="text-center text-oa-text-secondary py-8">
                  All preset servers have been added
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Server Name *
                </label>
                <input
                  type="text"
                  value={customServer.name}
                  onChange={(e) => setCustomServer({ ...customServer, name: e.target.value })}
                  placeholder="My MCP Server"
                  className="w-full px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:border-oa-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Type
                </label>
                <select
                  value={customServer.type}
                  onChange={(e) => setCustomServer({ ...customServer, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:border-oa-accent"
                >
                  <option value="stdio">STDIO (Command)</option>
                  <option value="http">HTTP</option>
                  <option value="sse">SSE (Server-Sent Events)</option>
                </select>
              </div>

              {customServer.type === 'stdio' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-oa-text-primary mb-2">
                      Command
                    </label>
                    <input
                      type="text"
                      value={customServer.command}
                      onChange={(e) => setCustomServer({ ...customServer, command: e.target.value })}
                      placeholder="npx"
                      className="w-full px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:border-oa-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-oa-text-primary mb-2">
                      Arguments
                    </label>
                    <input
                      type="text"
                      value={customServer.args}
                      onChange={(e) => setCustomServer({ ...customServer, args: e.target.value })}
                      placeholder="-y @anthropics/mcp-server-name"
                      className="w-full px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:border-oa-accent"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-oa-text-primary mb-2">
                    Server URL
                  </label>
                  <input
                    type="url"
                    value={customServer.url}
                    onChange={(e) => setCustomServer({ ...customServer, url: e.target.value })}
                    placeholder="https://mcp-server.example.com"
                    className="w-full px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:border-oa-accent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-oa-text-primary mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={customServer.description}
                  onChange={(e) => setCustomServer({ ...customServer, description: e.target.value })}
                  placeholder="What does this server do?"
                  className="w-full px-4 py-2 bg-oa-bg-secondary border border-oa-border rounded-lg text-oa-text-primary focus:outline-none focus:border-oa-accent"
                />
              </div>

              <motion.button
                onClick={handleAddCustom}
                disabled={!customServer.name || isAdding}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-oa-accent text-white rounded-lg hover:bg-oa-accent/90 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Add Server
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
