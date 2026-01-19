/**
 * Unified Storage Service
 *
 * Handles file storage for both local file system and Supabase storage buckets.
 * Automatically routes to the correct storage based on DATA_SOURCE environment variable.
 */

import fs from 'fs/promises'
import path from 'path'
import { SHARED_PATHS, getProfilePaths } from './paths'
import { getDataSource, isSupabaseConfigured } from './data-source'

// @ts-ignore - Supabase may not be installed
type SupabaseClient = any

// Types
export interface StorageUploadOptions {
  profileId?: string
  category: 'avatars' | 'visionboards' | 'chat' | 'uploads' | 'images'
  filename?: string
  contentType?: string
  isPublic?: boolean
}

export interface StorageUploadResult {
  success: boolean
  url?: string
  publicUrl?: string
  filePath?: string
  filename?: string
  bucket?: string
  error?: string
}

export interface StorageListOptions {
  profileId?: string
  category: string
  limit?: number
  offset?: number
}

export interface StorageFile {
  name: string
  url: string
  size?: number
  contentType?: string
  createdAt?: string
}

/**
 * Map category to Supabase bucket name
 */
function getBucketName(category: string): string {
  const bucketMap: Record<string, string> = {
    avatars: 'avatars',
    visionboards: 'visionboards',
    chat: 'chat-uploads',
    uploads: 'assets',
    images: 'assets',
  }
  return bucketMap[category] || 'assets'
}

/**
 * Get local storage directory for category
 */
function getLocalDir(category: string, profileId?: string): string {
  if (profileId) {
    const profilePaths = getProfilePaths(profileId)
    switch (category) {
      case 'visionboards':
        return profilePaths.visionboards
      case 'avatars':
        return path.join(profilePaths.profile, 'avatars')
      case 'chat':
        return path.join(profilePaths.chats, 'uploads')
      default:
        return path.join(profilePaths.profile, category)
    }
  }
  return path.join(SHARED_PATHS.assets, category)
}

/**
 * Upload file to storage
 */
export async function uploadFile(
  fileData: Buffer | Blob,
  options: StorageUploadOptions
): Promise<StorageUploadResult> {
  const dataSource = getDataSource()

  if (dataSource === 'supabase' && isSupabaseConfigured()) {
    return uploadToSupabase(fileData, options)
  }

  return uploadToLocal(fileData, options)
}

/**
 * Upload to local file system
 */
async function uploadToLocal(
  fileData: Buffer | Blob,
  options: StorageUploadOptions
): Promise<StorageUploadResult> {
  try {
    const { profileId, category, filename, contentType } = options

    // Get directory
    const dir = getLocalDir(category, profileId)
    await fs.mkdir(dir, { recursive: true })

    // Generate filename if not provided
    const ext = getExtensionFromMime(contentType || 'application/octet-stream')
    const finalFilename = filename || `${category}-${Date.now()}${ext}`
    const filePath = path.join(dir, finalFilename)

    // Convert Blob to Buffer if needed
    let buffer: Buffer
    if (fileData instanceof Buffer) {
      buffer = fileData
    } else if ('arrayBuffer' in fileData) {
      buffer = Buffer.from(await (fileData as Blob).arrayBuffer())
    } else {
      buffer = Buffer.from(fileData as any)
    }

    // Write file
    await fs.writeFile(filePath, buffer)

    // Build URL
    const url = profileId
      ? `/api/assets/${category}/${finalFilename}?profileId=${profileId}`
      : `/api/assets/${category}/${finalFilename}`

    return {
      success: true,
      url,
      publicUrl: url,
      filePath,
      filename: finalFilename,
    }
  } catch (error: any) {
    console.error('Local upload error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Upload to Supabase storage
 */
async function uploadToSupabase(
  fileData: Buffer | Blob,
  options: StorageUploadOptions
): Promise<StorageUploadResult> {
  try {
    // Dynamic import to avoid errors when Supabase isn't installed
    let createClient: any
    try {
      createClient = require('@supabase/supabase-js').createClient
    } catch {
      // Supabase not installed, fallback to local
      return uploadToLocal(fileData, options)
    }

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { profileId, category, filename, contentType, isPublic } = options

    const bucket = getBucketName(category)

    // Generate filename and path
    const ext = getExtensionFromMime(contentType || 'application/octet-stream')
    const finalFilename = filename || `${category}-${Date.now()}${ext}`
    const filePath = profileId
      ? `${profileId}/${finalFilename}`
      : `shared/${finalFilename}`

    // Upload
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileData, {
        contentType: contentType || 'application/octet-stream',
        upsert: true,
      })

    if (error) {
      throw error
    }

    // Get public URL if bucket is public
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: urlData.publicUrl,
      publicUrl: urlData.publicUrl,
      filename: finalFilename,
      bucket,
    }
  } catch (error: any) {
    console.error('Supabase upload error:', error)

    // Fallback to local if Supabase fails
    console.log('Falling back to local storage...')
    return uploadToLocal(fileData, options)
  }
}

/**
 * Get file from storage
 */
export async function getFile(
  filename: string,
  options: { profileId?: string; category: string }
): Promise<{ success: boolean; data?: Buffer; url?: string; error?: string }> {
  const dataSource = getDataSource()

  if (dataSource === 'supabase' && isSupabaseConfigured()) {
    return getFromSupabase(filename, options)
  }

  return getFromLocal(filename, options)
}

/**
 * Get file from local storage
 */
async function getFromLocal(
  filename: string,
  options: { profileId?: string; category: string }
): Promise<{ success: boolean; data?: Buffer; url?: string; error?: string }> {
  try {
    const dir = getLocalDir(options.category, options.profileId)
    const filePath = path.join(dir, filename)

    const data = await fs.readFile(filePath)

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get file from Supabase storage
 */
async function getFromSupabase(
  filename: string,
  options: { profileId?: string; category: string }
): Promise<{ success: boolean; data?: Buffer; url?: string; error?: string }> {
  try {
    let createClient: any
    try {
      createClient = require('@supabase/supabase-js').createClient
    } catch {
      return getFromLocal(filename, options)
    }

    const supabaseUrl = process.env.SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_ANON_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    const bucket = getBucketName(options.category)
    const filePath = options.profileId
      ? `${options.profileId}/${filename}`
      : `shared/${filename}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)

    if (error) {
      throw error
    }

    const buffer = Buffer.from(await data.arrayBuffer())

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return { success: true, data: buffer, url: urlData.publicUrl }
  } catch (error: any) {
    // Fallback to local
    return getFromLocal(filename, options)
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  filename: string,
  options: { profileId?: string; category: string }
): Promise<{ success: boolean; error?: string }> {
  const dataSource = getDataSource()

  if (dataSource === 'supabase' && isSupabaseConfigured()) {
    try {
      let createClient: any
      try {
        createClient = require('@supabase/supabase-js').createClient
      } catch {
        // Fall through to local delete
      }

      if (createClient) {
        const supabaseUrl = process.env.SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

        const supabase = createClient(supabaseUrl, supabaseKey)

        const bucket = getBucketName(options.category)
        const filePath = options.profileId
          ? `${options.profileId}/${filename}`
          : `shared/${filename}`

        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath])

        if (error) throw error

        return { success: true }
      }
    } catch (error: any) {
      console.error('Supabase delete error:', error)
    }
  }

  // Local delete
  try {
    const dir = getLocalDir(options.category, options.profileId)
    const filePath = path.join(dir, filename)
    await fs.unlink(filePath)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * List files in storage
 */
export async function listFiles(options: StorageListOptions): Promise<StorageFile[]> {
  const dataSource = getDataSource()

  if (dataSource === 'supabase' && isSupabaseConfigured()) {
    try {
      let createClient: any
      try {
        createClient = require('@supabase/supabase-js').createClient
      } catch {
        // Fall through to local list
      }

      if (createClient) {
        const supabaseUrl = process.env.SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_ANON_KEY!

        const supabase = createClient(supabaseUrl, supabaseKey)

        const bucket = getBucketName(options.category)
        const folder = options.profileId || 'shared'

        const { data, error } = await supabase.storage
          .from(bucket)
          .list(folder, {
            limit: options.limit || 100,
            offset: options.offset || 0,
          })

        if (error) throw error

        return (data || []).map((file: any) => {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(`${folder}/${file.name}`)

          return {
            name: file.name,
            url: urlData.publicUrl,
            size: file.metadata?.size,
            contentType: file.metadata?.mimetype,
            createdAt: file.created_at,
          }
        })
      }
    } catch (error) {
      console.error('Supabase list error:', error)
    }
  }

  // Local list
  try {
    const dir = getLocalDir(options.category, options.profileId)
    const files = await fs.readdir(dir)

    const result: StorageFile[] = []
    for (const filename of files.slice(options.offset || 0, (options.offset || 0) + (options.limit || 100))) {
      const filePath = path.join(dir, filename)
      const stat = await fs.stat(filePath)

      if (stat.isFile()) {
        result.push({
          name: filename,
          url: options.profileId
            ? `/api/assets/${options.category}/${filename}?profileId=${options.profileId}`
            : `/api/assets/${options.category}/${filename}`,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        })
      }
    }

    return result
  } catch (error) {
    return []
  }
}

/**
 * Get extension from MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'application/pdf': '.pdf',
  }
  return mimeMap[mimeType] || '.bin'
}

/**
 * Get storage status
 */
export function getStorageStatus(): {
  type: 'local' | 'supabase'
  configured: boolean
  buckets: string[]
} {
  const dataSource = getDataSource()
  const supabaseConfigured = isSupabaseConfigured()

  return {
    type: dataSource === 'supabase' && supabaseConfigured ? 'supabase' : 'local',
    configured: dataSource === 'local' || supabaseConfigured,
    buckets: ['avatars', 'visionboards', 'chat-uploads', 'assets'],
  }
}
