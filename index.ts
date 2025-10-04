#!/usr/bin/env bun

import React from 'react';
import { render } from 'ink';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfig, addRecentDirectory, saveConfig } from './src/config';
import { scanDirectory } from './src/scanner';
import { App } from './src/App';
import type { ProjectInfo } from './src/scanner';

function printInitScript(projectsPath?: string) {
  const configPath = projectsPath ? `--path="${projectsPath}"` : '';
  
  // Detect shell type
  const shell = process.env.SHELL || '';
  const isFish = shell.includes('fish');
  
  if (isFish) {
    console.log(`function kai
  set -l output (command kai ${configPath} $argv 2>/dev/tty | string collect)
  set -l exit_code $status
  
  if test $exit_code -eq 0 -a -n "$output"
    eval $output
  else
    return $exit_code
  end
end`);
  } else {
    console.log(`kai() {
  local output
  output=$(command kai ${configPath} "$@" 2>/dev/tty)
  local exit_code=$?
  
  if [ $exit_code -eq 0 ] && [ -n "$output" ]; then
    eval "$output"
  else
    return $exit_code
  fi
}`);
  }
}

function showApp(projectsDir: string, recentDirs: any[]) {
  const projects = scanDirectory(projectsDir);

  if (projects.length === 0) {
    console.error(`No directories found in: ${projectsDir}`);
    console.error('Create some directories first or configure a different path.');
    process.exit(1);
  }

  const handleSelect = (project: ProjectInfo) => {
    addRecentDirectory(project.path, project.name);
    // Output cd command to stdout (to be eval'd by shell wrapper)
    console.log(`cd '${project.path.replace(/'/g, "'\"'\"'")}'`);
  };

  const handleCancel = () => {
    // Just exit without output
  };

  const handleCreate = () => {
    // For now, we'll handle creation via a simple prompt
    // You could extend this with a proper creation dialog
    console.log('Create new directory (not implemented yet)');
  };

  render(
    React.createElement(App, {
      projects,
      recentDirs,
      onSelect: handleSelect,
      onCancel: handleCancel,
      onCreate: handleCreate,
    })
  );
}

function main() {
  // Handle init command
  if (process.argv[2] === 'init') {
    const projectsPath = process.argv[3];
    printInitScript(projectsPath);
    process.exit(0);
  }

  const config = loadConfig();
  
  // Check for --path flag to override config
  const pathFlagIndex = process.argv.findIndex(arg => arg.startsWith('--path='));
  if (pathFlagIndex !== -1) {
    const pathArg = process.argv[pathFlagIndex];
    if (pathArg) {
      const pathValue = pathArg.split('=')[1];
      if (pathValue) {
        config.projectsDir = pathValue.replace(/^["']|["']$/g, ''); // Remove quotes
      }
    }
  }

  // Check if projects directory exists
  if (!existsSync(config.projectsDir)) {
    console.error(`Projects directory not found: ${config.projectsDir}`);
    console.error('Configure the path by editing ~/.config/kai/config.json');
    process.exit(1);
  }

  showApp(config.projectsDir, config.recentDirs);
}

main();