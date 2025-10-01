#!/usr/bin/env node

/**
 * Cross-platform script router
 * Detects OS and runs appropriate PowerShell (.ps1) or Bash (.sh) script
 */

import { spawn } from 'child_process';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PLATFORM = platform();
const isWindows = PLATFORM === 'win32';

const SCRIPT_MAP = {
  setup: 'setup',
  seed: 'seed',
  hasura: 'apply-hasura',
  dev: 'start-all'
};

function runScript(scriptName) {
  const extension = isWindows ? 'ps1' : 'sh';
  const scriptPath = join(__dirname, `${scriptName}.${extension}`);

  let command, args;

  if (isWindows) {
    // PowerShell on Windows
    command = 'powershell.exe';
    args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath];
  } else {
    // Bash on macOS/Linux
    command = 'bash';
    args = [scriptPath];
  }

  console.log(`Running: ${scriptName}.${extension}`);

  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    cwd: join(__dirname, '..')
  });

  child.on('error', (error) => {
    console.error(`Error executing script: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

function main() {
  const command = process.argv[2];

  if (!command) {
    console.error('Usage: node run-plat.js <command>');
    console.error('Available commands: setup, seed, hasura, dev');
    process.exit(1);
  }

  const scriptName = SCRIPT_MAP[command];

  if (!scriptName) {
    console.error(`Unknown command: ${command}`);
    console.error('Available commands: setup, seed, hasura, dev');
    process.exit(1);
  }

  runScript(scriptName);
}

main();
