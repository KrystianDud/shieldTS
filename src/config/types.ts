export interface ShieldTSConfig {
  ignore?: {
    files?: string[];
    patterns?: string[];
    lines?: string[];
  };
  severity?: {
    highEntropy?: 'error' | 'warning' | 'off';
    knownPatterns?: 'error' | 'warning' | 'off';
    base64Secrets?: 'error' | 'warning' | 'off';
  };
  thresholds?: {
    entropyScore?: number;
    minSecretLength?: number;
  };
  providers?: {
    supabase?: boolean;
    firebase?: boolean;
    aws?: boolean;
    stripe?: boolean;
    generic?: boolean;
  };
}

export interface SecurityIssue {
  type: 'high-entropy' | 'known-pattern' | 'base64-secret' | 'client-side-secret';
  severity: 'error' | 'warning';
  file: string;
  line: number;
  column: number;
  message: string;
  snippet: string;
  provider?: string;
  educationalContent?: string;
  bestPracticeLink?: string;
}

export interface ScanResult {
  issues: SecurityIssue[];
  filesScanned: number;
  passed: boolean;
}
