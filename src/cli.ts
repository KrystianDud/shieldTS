#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { runShieldTS } from './index';

const program = new Command();

program
  .name('shieldts')
  .description('TypeScript security scanner that prevents builds with exposed secrets')
  .version('0.1.0')
  .option('-p, --project <path>', 'Project root directory', process.cwd())
  .option('--no-check-env', 'Skip NODE_ENV check (run regardless of environment)')
  .action(async (options) => {
    const projectRoot = path.resolve(options.project);
    const shouldCheckEnv = options.checkEnv !== false;

    // Check if we should run based on NODE_ENV
    if (shouldCheckEnv) {
      const nodeEnv = process.env.NODE_ENV;

      // Only run if NODE_ENV is 'production' or undefined
      if (nodeEnv && nodeEnv !== 'production') {
        console.log(`[INFO] Skipping ShieldTS scan (NODE_ENV=${nodeEnv})`);
        console.log('[INFO] ShieldTS runs on production builds or when NODE_ENV is undefined');
        console.log('       To run manually: shieldts --no-check-env\n');
        process.exit(0);
      }
    }

    try {
      await runShieldTS(projectRoot);
    } catch (error) {
      console.error('Error running ShieldTS:', error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Setup ShieldTS to run automatically before builds')
  .option('-p, --project <path>', 'Project root directory', process.cwd())
  .action((options) => {
    const projectRoot = path.resolve(options.project);
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.error('[ERROR] No package.json found in', projectRoot);
      process.exit(1);
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      // Check if already configured
      if (packageJson.scripts.build?.includes('shieldts')) {
        console.log('[INFO] ShieldTS is already configured in your build script');
        process.exit(0);
      }

      // Backup original build script
      const originalBuild = packageJson.scripts.build || 'echo "No build script defined"';

      // Prepend shieldts to build script
      packageJson.scripts.build = `shieldts && ${originalBuild}`;

      // Write back to package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

      console.log('[SUCCESS] ShieldTS has been added to your build script!');
      console.log('');
      console.log('  Before:', originalBuild);
      console.log('  After: ', packageJson.scripts.build);
      console.log('');
      console.log('[INFO] Now when you run "npm run build", ShieldTS will scan first.');
      console.log('');
    } catch (error) {
      console.error('[ERROR] Failed to update package.json:', error);
      process.exit(1);
    }
  });

program.parse();
