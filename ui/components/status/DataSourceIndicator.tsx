'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HardDrive, Cloud, Server, Loader2 } from 'lucide-react'

interface DataSourceInfo {
  current: 'local' | 'supabase' | 'mcp'
  message: string
  available: {
    local: boolean
    supabase: boolean
    mcp: boolean
  }
}

export function DataSourceIndicator() {
  const [dataSource, setDataSource] = useState<DataSourceInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDataSourceStatus()
  }, [])

  const loadDataSourceStatus = async () => {
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      if (data.dataSource) {
        setDataSource(data.dataSource)
      }
    } catch (err) {
      console.error('Failed to load data source status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-oa-bg-tertiary rounded-lg">
        <Loader2 className="w-3 h-3 animate-spin text-oa-text-secondary" />
        <span className="text-xs text-oa-text-secondary">Loading...</span>
      </div>
    )
  }

  if (!dataSource) return null

  const getIcon = () => {
    switch (dataSource.current) {
      case 'mcp':
        return <Server className="w-3.5 h-3.5" />
      case 'supabase':
        return <Cloud className="w-3.5 h-3.5" />
      default:
        return <HardDrive className="w-3.5 h-3.5" />
    }
  }

  const getLabel = () => {
    switch (dataSource.current) {
      case 'mcp':
        return 'MCP'
      case 'supabase':
        return 'Cloud'
      default:
        return 'Local'
    }
  }

  const getColorClass = () => {
    switch (dataSource.current) {
      case 'mcp':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'supabase':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default:
        return 'bg-green-500/10 text-green-400 border-green-500/20'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getColorClass()}`}
      title={dataSource.message}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </motion.div>
  )
}

// Compact version for use in tight spaces
export function DataSourceBadge() {
  const [dataSource, setDataSource] = useState<'local' | 'supabase' | 'mcp' | null>(null)

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.dataSource?.current) {
          setDataSource(data.dataSource.current)
        }
      })
      .catch(() => {})
  }, [])

  if (!dataSource) return null

  const colors = {
    mcp: 'bg-purple-500',
    supabase: 'bg-blue-500',
    local: 'bg-green-500',
  }

  const labels = {
    mcp: 'MCP',
    supabase: 'Cloud',
    local: 'Local',
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${colors[dataSource]}`}
      title={`Data source: ${labels[dataSource]}`}
    >
      {labels[dataSource]}
    </span>
  )
}
