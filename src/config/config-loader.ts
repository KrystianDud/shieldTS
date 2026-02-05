import * as fs from 'fs';
import * as path from 'path';
import { ShieldTSConfig } from './types';

const DEFAULT_CONFIG: ShieldTSConfig = {
  ignore: {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
    patterns: ['your_api_key', 'example_', '_example', 'demo_', '_demo', 'mock_', '_mock', 'placeholder_', '_placeholder', 'xxx', 'yyy', 'zzz'],
    lines: []
  },
  severity: {
    highEntropy: 'error',
    knownPatterns: 'error',
    base64Secrets: 'warning'
  },
  thresholds: {
    entropyScore: 3.5,
    minSecretLength: 20
  },
  providers: {
    supabase: true,
    firebase: true,
    aws: true,
    stripe: true,
    generic: true
  }
};

export function loadConfig(projectRoot: string): ShieldTSConfig {
  const configPath = path.join(projectRoot, '.shieldtsrc');

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(configContent);

    // Deep merge with defaults
    return mergeConfig(DEFAULT_CONFIG, userConfig);
  } catch (error) {
    console.warn(`Warning: Failed to parse .shieldtsrc, using defaults. Error: ${error}`);
    return DEFAULT_CONFIG;
  }
}

function mergeConfig(defaults: ShieldTSConfig, user: Partial<ShieldTSConfig>): ShieldTSConfig {
  return {
    ignore: {
      ...defaults.ignore,
      ...user.ignore,
      files: [...(defaults.ignore?.files || []), ...(user.ignore?.files || [])],
      patterns: [...(defaults.ignore?.patterns || []), ...(user.ignore?.patterns || [])],
      lines: [...(defaults.ignore?.lines || []), ...(user.ignore?.lines || [])]
    },
    severity: { ...defaults.severity, ...user.severity },
    thresholds: { ...defaults.thresholds, ...user.thresholds },
    providers: { ...defaults.providers, ...user.providers }
  };
}
