#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
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

program.parse();
