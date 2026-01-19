/**
 * Sandbox Code Executor
 *
 * Provides isolated code execution environment for LLM-generated code.
 * Supports JavaScript/TypeScript, Python, and shell commands.
 * Saves context by executing code server-side and returning only results.
 */

import { spawn, execSync } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import crypto from 'crypto'

// Generate a unique ID without external dependency
function generateId(): string {
  return crypto.randomBytes(16).toString('hex')
}

export interface ExecutionRequest {
  language: 'javascript' | 'typescript' | 'python' | 'shell' | 'bash'
  code: string
  timeout?: number  // milliseconds
  env?: Record<string, string>
  workingDir?: string
}

export interface ExecutionResult {
  success: boolean
  output: string
  error?: string
  executionTime: number
  language: string
  truncated?: boolean
}

// Sandbox configuration
const SANDBOX_CONFIG = {
  maxOutputSize: 50000,      // 50KB max output
  defaultTimeout: 30000,     // 30 seconds default
  maxTimeout: 120000,        // 2 minutes max
  tempDir: path.join(os.tmpdir(), '10x-sandbox'),
}

/**
 * Initialize sandbox directory
 */
async function ensureSandboxDir(): Promise<string> {
  await fs.mkdir(SANDBOX_CONFIG.tempDir, { recursive: true })
  return SANDBOX_CONFIG.tempDir
}

/**
 * Clean up old sandbox files (files older than 1 hour)
 */
async function cleanupOldFiles(): Promise<void> {
  try {
    const dir = await ensureSandboxDir()
    const files = await fs.readdir(dir)
    const oneHourAgo = Date.now() - (60 * 60 * 1000)

    for (const file of files) {
      const filePath = path.join(dir, file)
      try {
        const stat = await fs.stat(filePath)
        if (stat.mtimeMs < oneHourAgo) {
          await fs.rm(filePath, { recursive: true })
        }
      } catch {
        // Ignore errors for individual files
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Execute JavaScript/TypeScript code in an isolated context
 */
async function executeJavaScript(
  code: string,
  isTypeScript: boolean,
  timeout: number,
  env?: Record<string, string>
): Promise<ExecutionResult> {
  const startTime = Date.now()
  const sandboxDir = await ensureSandboxDir()
  const fileId = generateId()
  const ext = isTypeScript ? '.ts' : '.js'
  const filePath = path.join(sandboxDir, `script-${fileId}${ext}`)

  try {
    // Wrap code in a safe execution context
    const wrappedCode = `
const __output = [];
const console = {
  log: (...args) => __output.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
  error: (...args) => __output.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
  warn: (...args) => __output.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
  info: (...args) => __output.push('[INFO] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
};

try {
  ${code}
} catch (e) {
  console.error(e.message);
}

process.stdout.write(__output.join('\\n'));
`

    await fs.writeFile(filePath, wrappedCode)

    // Execute with node or ts-node
    const command = isTypeScript ? 'npx' : 'node'
    const args = isTypeScript ? ['ts-node', '--transpile-only', filePath] : [filePath]

    return new Promise((resolve) => {
      let output = ''
      let errorOutput = ''

      const proc = spawn(command, args, {
        timeout,
        env: { ...process.env, ...env },
        cwd: sandboxDir,
        shell: process.platform === 'win32', // Use shell on Windows for better path resolution
      })

      proc.stdout.on('data', (data) => {
        output += data.toString()
        if (output.length > SANDBOX_CONFIG.maxOutputSize) {
          proc.kill()
        }
      })

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      proc.on('close', async (code) => {
        // Cleanup
        try {
          await fs.unlink(filePath)
        } catch {}

        const truncated = output.length > SANDBOX_CONFIG.maxOutputSize
        if (truncated) {
          output = output.slice(0, SANDBOX_CONFIG.maxOutputSize) + '\n...[output truncated]'
        }

        resolve({
          success: code === 0,
          output: output || errorOutput,
          error: code !== 0 ? errorOutput : undefined,
          executionTime: Date.now() - startTime,
          language: isTypeScript ? 'typescript' : 'javascript',
          truncated,
        })
      })

      proc.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: err.message,
          executionTime: Date.now() - startTime,
          language: isTypeScript ? 'typescript' : 'javascript',
        })
      })
    })

  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
      language: isTypeScript ? 'typescript' : 'javascript',
    }
  }
}

/**
 * Execute Python code
 */
async function executePython(
  code: string,
  timeout: number,
  env?: Record<string, string>
): Promise<ExecutionResult> {
  const startTime = Date.now()
  const sandboxDir = await ensureSandboxDir()
  const fileId = generateId()
  const filePath = path.join(sandboxDir, `script-${fileId}.py`)

  try {
    await fs.writeFile(filePath, code)

    return new Promise((resolve) => {
      let output = ''
      let errorOutput = ''

      // Use 'python' on Windows, 'python3' on Mac/Linux
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
      const proc = spawn(pythonCmd, [filePath], {
        timeout,
        env: { ...process.env, ...env },
        cwd: sandboxDir,
        shell: process.platform === 'win32', // Use shell on Windows for better path resolution
      })

      proc.stdout.on('data', (data) => {
        output += data.toString()
        if (output.length > SANDBOX_CONFIG.maxOutputSize) {
          proc.kill()
        }
      })

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      proc.on('close', async (code) => {
        try {
          await fs.unlink(filePath)
        } catch {}

        const truncated = output.length > SANDBOX_CONFIG.maxOutputSize
        if (truncated) {
          output = output.slice(0, SANDBOX_CONFIG.maxOutputSize) + '\n...[output truncated]'
        }

        resolve({
          success: code === 0,
          output: output || errorOutput,
          error: code !== 0 ? errorOutput : undefined,
          executionTime: Date.now() - startTime,
          language: 'python',
          truncated,
        })
      })

      proc.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: `Python not available: ${err.message}`,
          executionTime: Date.now() - startTime,
          language: 'python',
        })
      })
    })

  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
      language: 'python',
    }
  }
}

/**
 * Execute shell/bash commands (limited to safe commands)
 */
async function executeShell(
  code: string,
  timeout: number,
  workingDir?: string
): Promise<ExecutionResult> {
  const startTime = Date.now()

  // Blocklist dangerous commands
  const dangerousPatterns = [
    /\brm\s+-rf\s+[\/~]/i,
    /\bsudo\b/i,
    /\bchmod\b/i,
    /\bchown\b/i,
    /\bmkfs\b/i,
    /\bdd\b.*\bif=/i,
    /\bformat\b/i,
    /\bdel\s+\/[fs]/i,
    /\brd\s+\/s/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        success: false,
        output: '',
        error: 'Command blocked for security reasons',
        executionTime: Date.now() - startTime,
        language: 'shell',
      }
    }
  }

  try {
    return new Promise((resolve) => {
      let output = ''
      let errorOutput = ''

      const isWindows = process.platform === 'win32'
      const shell = isWindows ? 'cmd.exe' : '/bin/bash'
      const shellArgs = isWindows ? ['/c', code] : ['-c', code]

      const proc = spawn(shell, shellArgs, {
        timeout,
        cwd: workingDir || process.cwd(),
      })

      proc.stdout.on('data', (data) => {
        output += data.toString()
        if (output.length > SANDBOX_CONFIG.maxOutputSize) {
          proc.kill()
        }
      })

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      proc.on('close', (code) => {
        const truncated = output.length > SANDBOX_CONFIG.maxOutputSize
        if (truncated) {
          output = output.slice(0, SANDBOX_CONFIG.maxOutputSize) + '\n...[output truncated]'
        }

        resolve({
          success: code === 0,
          output: output || errorOutput,
          error: code !== 0 ? errorOutput : undefined,
          executionTime: Date.now() - startTime,
          language: 'shell',
          truncated,
        })
      })

      proc.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: err.message,
          executionTime: Date.now() - startTime,
          language: 'shell',
        })
      })
    })

  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
      language: 'shell',
    }
  }
}

/**
 * Main execution function - routes to appropriate executor
 */
export async function executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
  // Cleanup old files periodically
  cleanupOldFiles()

  const timeout = Math.min(
    request.timeout || SANDBOX_CONFIG.defaultTimeout,
    SANDBOX_CONFIG.maxTimeout
  )

  switch (request.language) {
    case 'javascript':
      return executeJavaScript(request.code, false, timeout, request.env)

    case 'typescript':
      return executeJavaScript(request.code, true, timeout, request.env)

    case 'python':
      return executePython(request.code, timeout, request.env)

    case 'shell':
    case 'bash':
      return executeShell(request.code, timeout, request.workingDir)

    default:
      return {
        success: false,
        output: '',
        error: `Unsupported language: ${request.language}`,
        executionTime: 0,
        language: request.language,
      }
  }
}

/**
 * Format execution result for LLM context (minimal tokens)
 */
export function formatResultForLLM(result: ExecutionResult): string {
  if (result.success) {
    return `[Executed ${result.language} code in ${result.executionTime}ms]\nOutput:\n${result.output}`
  } else {
    return `[${result.language} execution failed after ${result.executionTime}ms]\nError: ${result.error}\nOutput: ${result.output}`
  }
}
