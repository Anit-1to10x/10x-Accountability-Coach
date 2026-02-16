#!/usr/bin/env node
/**
 * OpenAnalyst - Interactive Setup Script
 *
 * This script handles:
 * 1. Checking system requirements (Node.js version, npm)
 * 2. Prompting for API key if not configured
 * 3. Creating .env.local configuration file
 * 4. Installing all dependencies
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

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Log step
function logStep(step, message) {
  console.log(`\n${colors.cyan}[${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

// Log success
function logSuccess(message) {
  console.log(`  ${colors.green}✓${colors.reset} ${message}`);
}

// Log warning
function logWarning(message) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${message}`);
}

// Log error
function logError(message) {
  console.log(`  ${colors.red}✗${colors.reset} ${message}`);
}

// Show banner
function showBanner() {
  console.log('\n' + colors.cyan + colors.bright);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║           10X Accountability Coach - Setup                   ║');
  console.log('║                    by Team 10X                               ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

// Check Node.js version
function checkNodeVersion() {
  logStep('1/5', 'Checking Node.js version...');

  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0], 10);

    if (major < 18) {
      logError(`Node.js ${version} detected. Version 18+ is required.`);
      console.log(`\n  Please upgrade Node.js: https://nodejs.org/`);
      return false;
    }

    logSuccess(`Node.js ${version} detected`);
    return true;
  } catch (error) {
    logError('Could not detect Node.js version');
    return false;
  }
}

// Check npm
function checkNpm() {
  logStep('2/5', 'Checking npm...');

  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    logSuccess(`npm ${version} detected`);
    return true;
  } catch (error) {
    logError('npm not found. Please install Node.js from https://nodejs.org/');
    return false;
  }
}

// Check and configure API key
async function configureApiKey(rl) {
  logStep('3/5', 'Checking API configuration...');

  // Check if .env.local exists
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf-8');

    // Check if API key is configured (not the placeholder)
    if (!content.includes('sk-oa-v1-your-key-here') && content.includes('OPENANALYST_API_KEY=sk-')) {
      logSuccess('API key already configured');
      return true;
    }

    logWarning('API key not configured yet');
  } else {
    logWarning('.env.local file not found');
  }

  // Ask user for API key
  console.log('\n' + colors.yellow + '  The OpenAnalyst API key is required for AI chat functionality.' + colors.reset);
  console.log(colors.dim + '  Get your API key from: https://10x.in/dashboard' + colors.reset);
  console.log();

  const apiKey = await ask(rl, colors.cyan + '  Enter your OpenAnalyst API key (or press Enter to skip): ' + colors.reset);

  if (!apiKey) {
    logWarning('Skipping API key configuration. You can add it later to ui/.env.local');

    // Create a placeholder .env.local
    const placeholderEnv = `# 10X ACCOUNTABILITY COACH
# Get your API key from: https://10x.in/dashboard
OPENANALYST_API_URL=https://api.openanalyst.com/api
OPENANALYST_API_KEY=sk-oa-v1-your-key-here
OPENANALYST_MODEL=openanalyst-beta
DATA_SOURCE=local
`;
    fs.writeFileSync(ENV_FILE, placeholderEnv);
    return false;
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-')) {
    logWarning('API key should start with "sk-". Saving anyway...');
  }

  // Ask for API URL (with default)
  const defaultUrl = 'https://api.openanalyst.com/api';
  const apiUrl = await ask(rl, colors.cyan + `  API URL [${defaultUrl}]: ` + colors.reset) || defaultUrl;

  // Ask for model (with default)
  const defaultModel = 'openanalyst-beta';
  const model = await ask(rl, colors.cyan + `  Model [${defaultModel}]: ` + colors.reset) || defaultModel;

  // Create .env.local file
  const envContent = `# 10X ACCOUNTABILITY COACH - Generated by Setup on ${new Date().toISOString()}
OPENANALYST_API_URL=${apiUrl}
OPENANALYST_API_KEY=${apiKey}
OPENANALYST_MODEL=${model}
DATA_SOURCE=local
`;

  fs.writeFileSync(ENV_FILE, envContent);
  logSuccess('API configuration saved to ui/.env.local');

  return true;
}

// Install dependencies
async function installDependencies() {
  logStep('4/5', 'Installing dependencies...');

  // Check if node_modules exists in root
  const rootModules = path.join(ROOT_DIR, 'node_modules');
  const uiModules = path.join(UI_DIR, 'node_modules');

  const needsRootInstall = !fs.existsSync(rootModules);
  const needsUiInstall = !fs.existsSync(uiModules);

  if (!needsRootInstall && !needsUiInstall) {
    logSuccess('All dependencies already installed');
    return true;
  }

  if (needsRootInstall) {
    console.log(colors.dim + '  Installing root dependencies...' + colors.reset);
    try {
      execSync('npm install', { cwd: ROOT_DIR, stdio: 'pipe' });
      logSuccess('Root dependencies installed');
    } catch (error) {
      logError('Failed to install root dependencies');
      console.log(colors.dim + '  Try running: npm install' + colors.reset);
      return false;
    }
  }

  if (needsUiInstall) {
    console.log(colors.dim + '  Installing UI dependencies...' + colors.reset);
    try {
      execSync('npm install', { cwd: UI_DIR, stdio: 'pipe' });
      logSuccess('UI dependencies installed');
    } catch (error) {
      logError('Failed to install UI dependencies');
      console.log(colors.dim + '  Try running: cd ui && npm install' + colors.reset);
      return false;
    }
  }

  return true;
}

// Create data directories
function createDataDirectories() {
  logStep('5/5', 'Setting up data directories...');

  const directories = [
    path.join(ROOT_DIR, 'data'),
    path.join(ROOT_DIR, 'data', 'profiles'),
    path.join(ROOT_DIR, 'data', 'challenges'),
    path.join(ROOT_DIR, 'data', 'todos'),
    path.join(ROOT_DIR, 'data', '.registry'),
    path.join(ROOT_DIR, 'skills'),
    path.join(ROOT_DIR, 'commands'),
  ];

  let created = 0;
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      created++;
    }
  }

  if (created > 0) {
    logSuccess(`Created ${created} directories`);
  } else {
    logSuccess('All directories exist');
  }

  return true;
}

// Show completion message
function showCompletion(apiConfigured) {
  console.log('\n' + colors.green + colors.bright);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║                   Setup Complete!                            ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  console.log(colors.bright + '\nNext Steps:' + colors.reset);
  console.log('  1. Run ' + colors.cyan + 'npm start' + colors.reset + ' or ' + colors.cyan + 'cd ui && npm run dev' + colors.reset + ' to start the app');
  console.log('  2. Open ' + colors.cyan + 'http://localhost:3000' + colors.reset + ' in your browser');
  console.log('  3. Create your profile and start your first challenge');
  console.log('  4. Use slash commands in terminal: ' + colors.cyan + '/help' + colors.reset + ' to see all 37 commands');

  if (!apiConfigured) {
    console.log('\n' + colors.yellow + 'Note:' + colors.reset + ' Add your API key to ' + colors.cyan + 'ui/.env.local' + colors.reset + ' to enable AI chat');
    console.log('  Get your key at: ' + colors.cyan + 'https://10x.in/dashboard' + colors.reset);
  }

  console.log();
}

// Main setup function
async function main() {
  showBanner();

  const rl = createReadline();

  try {
    // Step 1: Check Node.js
    if (!checkNodeVersion()) {
      process.exit(1);
    }

    // Step 2: Check npm
    if (!checkNpm()) {
      process.exit(1);
    }

    // Step 3: Configure API key
    const apiConfigured = await configureApiKey(rl);

    // Step 4: Install dependencies
    const depsInstalled = await installDependencies();
    if (!depsInstalled) {
      logWarning('Some dependencies may be missing. Try running npm install manually.');
    }

    // Step 5: Create data directories
    createDataDirectories();

    // Done
    showCompletion(apiConfigured);

  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error(colors.red + 'Setup failed:' + colors.reset, error.message);
    process.exit(1);
  });
}

module.exports = { main };
