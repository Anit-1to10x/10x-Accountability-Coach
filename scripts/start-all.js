#!/usr/bin/env node
/**
 * OpenAnalyst - Startup Script
 *
 * Starts the Next.js UI with the integrated OpenAnalyst API.
 * Handles first-time setup including API key configuration.
 * No separate terminal or WebSocket server needed.
 */

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '..');
const UI_DIR = path.join(ROOT_DIR, 'ui');
const ENV_FILE = path.join(UI_DIR, '.env.local');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Track running processes
const processes = [];

// Create readline interface for user input
function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Ask a question and get user input
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Banner
function showBanner() {
  console.log('\n' + colors.cyan + colors.bright);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║               10X Accountability Coach                       ║');
  console.log('║                    by Team 10X                               ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset + '\n');
}

// Log with timestamp
function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors.bright}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

// Check Node.js version
function checkNodeVersion() {
  log('Checking Node.js version...', colors.blue);

  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);

  if (major < 18) {
    log(`✗ Node.js ${version} detected. Version 18+ required.`, colors.red);
    console.log(`\n  Please upgrade: ${colors.cyan}https://nodejs.org/${colors.reset}`);
    return false;
  }

  log(`✓ Node.js ${version}`, colors.green);
  return true;
}

// Check if this is first run (no .env.local or dependencies)
function isFirstRun() {
  const noEnv = !fs.existsSync(ENV_FILE);
  const noRootModules = !fs.existsSync(path.join(ROOT_DIR, 'node_modules'));
  const noUiModules = !fs.existsSync(path.join(UI_DIR, 'node_modules'));

  return noEnv || noRootModules || noUiModules;
}

// Check if API key needs configuration
function needsApiKeySetup() {
  if (!fs.existsSync(ENV_FILE)) {
    return true;
  }

  const content = fs.readFileSync(ENV_FILE, 'utf-8');
  return content.includes('sk-oa-v1-your-key-here') || !content.includes('OPENANALYST_API_KEY=sk-');
}

// Interactive API key setup
async function setupApiKey(rl) {
  log('API key not configured', colors.yellow);

  console.log('\n' + colors.cyan + '  The OpenAnalyst API key is required for AI chat.' + colors.reset);
  console.log(colors.dim + '  Get your key from: https://10x.in/dashboard' + colors.reset);
  console.log();

  const apiKey = await ask(rl, colors.bright + '  Enter your API key (or press Enter to skip): ' + colors.reset);

  if (!apiKey) {
    // Create placeholder
    const placeholderEnv = `# 10X ACCOUNTABILITY COACH
# Get your API key from: https://10x.in/dashboard
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=sk-oa-v1-your-key-here
OPENANALYST_MODEL=openanalyst-beta
DATA_SOURCE=local
`;
    fs.writeFileSync(ENV_FILE, placeholderEnv);
    log('⚠ Skipped API setup. Add key to ui/.env.local later.', colors.yellow);
    return false;
  }

  // Create .env.local with the provided key
  const envContent = `# 10X ACCOUNTABILITY COACH - Configured on ${new Date().toISOString()}
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=${apiKey}
OPENANALYST_MODEL=openanalyst-beta
DATA_SOURCE=local
`;

  fs.writeFileSync(ENV_FILE, envContent);
  log('✓ API key saved to ui/.env.local', colors.green);
  return true;
}

// Check if dependencies are installed
async function checkDependencies() {
  log('Checking dependencies...', colors.blue);

  let needsInstall = false;

  // Check root dependencies
  if (!fs.existsSync(path.join(ROOT_DIR, 'node_modules'))) {
    log('Installing root dependencies...', colors.yellow);
    needsInstall = true;

    await new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: ROOT_DIR,
        shell: true,
        stdio: 'inherit'
      });

      npm.on('close', (code) => {
        if (code === 0) {
          log('✓ Root dependencies installed', colors.green);
          resolve();
        } else {
          reject(new Error('Failed to install root dependencies'));
        }
      });
    });
  }

  // Check UI dependencies
  if (!fs.existsSync(path.join(UI_DIR, 'node_modules'))) {
    log('Installing UI dependencies...', colors.yellow);
    needsInstall = true;

    await new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: UI_DIR,
        shell: true,
        stdio: 'inherit'
      });

      npm.on('close', (code) => {
        if (code === 0) {
          log('✓ UI dependencies installed', colors.green);
          resolve();
        } else {
          reject(new Error('Failed to install UI dependencies'));
        }
      });
    });
  }

  if (!needsInstall) {
    log('✓ All dependencies OK', colors.green);
  }
}

// Create required data directories
function ensureDataDirectories() {
  const directories = [
    path.join(ROOT_DIR, 'data'),
    path.join(ROOT_DIR, 'data', 'profiles'),
    path.join(ROOT_DIR, 'data', 'challenges'),
    path.join(ROOT_DIR, 'data', 'todos'),
    path.join(ROOT_DIR, 'data', '.registry'),
    path.join(ROOT_DIR, 'skills'),
    path.join(ROOT_DIR, 'commands'),
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Check API configuration (without prompting)
function checkApiConfig() {
  log('Checking API configuration...', colors.blue);

  if (!fs.existsSync(ENV_FILE)) {
    return false;
  }

  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  if (envContent.includes('sk-oa-v1-your-key-here')) {
    log('⚠ API key is placeholder - update ui/.env.local', colors.yellow);
    return false;
  }

  log('✓ API configuration OK', colors.green);
  return true;
}

// Start Next.js UI
function startUI() {
  return new Promise((resolve, reject) => {
    log('Starting Next.js UI...', colors.blue);

    const ui = spawn('npm', ['run', 'dev'], {
      cwd: UI_DIR,
      shell: true,
    });

    processes.push({ name: 'Next.js UI', process: ui });

    let started = false;
    let timeout = null;

    // Timeout after 60 seconds
    timeout = setTimeout(() => {
      if (!started) {
        log('Starting UI (this may take a moment)...', colors.dim);
      }
    }, 10000);

    ui.stdout.on('data', (data) => {
      const output = data.toString();
      if ((output.includes('Ready in') || output.includes('started server')) && !started) {
        started = true;
        if (timeout) clearTimeout(timeout);
        log('✓ UI ready at http://localhost:3000', colors.green);
        setTimeout(resolve, 1000);
      }
    });

    ui.stderr.on('data', (data) => {
      const output = data.toString();
      // Only show actual errors, not warnings
      if (output.toLowerCase().includes('error') && !output.includes('ExperimentalWarning')) {
        console.error(`${colors.red}[UI Error]${colors.reset} ${data}`);
      }
    });

    ui.on('exit', (code) => {
      if (!started && code !== 0) {
        reject(new Error(`UI process exited with code ${code}`));
      }
    });
  });
}

// Show ready message
function showReadyMessage(apiConfigured) {
  console.log('\n' + colors.green + colors.bright);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║                  YOUR APP IS READY!                          ║');
  console.log('║                                                              ║');
  console.log('║               Open: http://localhost:3000                    ║');
  console.log('║                                                              ║');
  console.log('║  Features:                                                   ║');
  console.log('║    ✓ AI-powered chat (OpenAnalyst API)                       ║');
  console.log('║    ✓ Streaming responses                                     ║');
  console.log('║    ✓ Skills & slash commands                                 ║');
  console.log('║    ✓ Personalized coaching context                           ║');
  console.log('║                                                              ║');
  console.log('║  Press Ctrl+C to stop                                        ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset + '\n');

  if (!apiConfigured) {
    console.log(colors.yellow + colors.bright + '⚠  API Key Not Configured\n' + colors.reset);
    console.log('To enable AI chat, add your API key to:');
    console.log(colors.cyan + '  ui/.env.local' + colors.reset);
    console.log('\nExample:');
    console.log(colors.dim + '  OPENANALYST_API_URL=https://api.openanalyst.com/api');
    console.log('  OPENANALYST_API_KEY=sk-oa-v1-your-actual-key');
    console.log('  OPENANALYST_MODEL=openanalyst-beta' + colors.reset);
    console.log('');
  }
}

// Graceful shutdown
function shutdown() {
  console.log('\n' + colors.yellow + 'Shutting down...' + colors.reset);

  processes.forEach(({ name, process }) => {
    log(`Stopping ${name}...`, colors.yellow);
    try {
      process.kill();
    } catch (e) {
      // Process may already be dead
    }
  });

  log('All services stopped', colors.green);
  process.exit(0);
}

// Main startup sequence
async function main() {
  showBanner();

  let rl = null;

  try {
    // Step 1: Check Node.js version
    if (!checkNodeVersion()) {
      process.exit(1);
    }

    // Step 2: Check dependencies
    await checkDependencies();

    // Step 3: Ensure data directories exist
    ensureDataDirectories();

    // Step 4: Check/Setup API key
    let apiConfigured = false;

    if (needsApiKeySetup()) {
      rl = createReadline();
      apiConfigured = await setupApiKey(rl);
      rl.close();
      rl = null;
    } else {
      apiConfigured = checkApiConfig();
    }

    // Step 5: Start UI
    await startUI();

    // Show ready message
    showReadyMessage(apiConfigured);

    // Handle shutdown
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    if (rl) rl.close();
    console.error(`${colors.red}Startup failed:${colors.reset}`, error.message);
    shutdown();
  }
}

// Start
main();
