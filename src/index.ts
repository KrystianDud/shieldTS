import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import { loadConfig } from './config/config-loader';
import { ShieldTSConfig, SecurityIssue, ScanResult } from './config/types';
import { scanFileForPatterns } from './scanner/pattern-scanner';
import { scanFileForHighEntropy } from './scanner/entropy-scanner';
import { scanFileWithAST } from './scanner/ast-scanner';
import { scanFileForBase64Secrets } from './scanner/base64-scanner';
import { reportToConsole } from './reporters/console-reporter';
import { generateHTMLReport } from './reporters/html-reporter';

export async function scan(projectRoot: string = process.cwd()): Promise<ScanResult> {
  const config = loadConfig(projectRoot);

  // Find all TypeScript/JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'coverage/**', ...(config.ignore?.files || [])],
    absolute: true
  });

  const issues: SecurityIssue[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(projectRoot, file);

    // Run all scanners
    const fileIssues = [
      ...scanFileForPatterns(relativePath, content),
      ...scanFileForHighEntropy(relativePath, content, config.thresholds?.entropyScore, config.thresholds?.minSecretLength),
      ...scanFileWithAST(relativePath, content),
      ...scanFileForBase64Secrets(relativePath, content)
    ];

    // Filter issues based on config
    const filteredIssues = filterIssues(fileIssues, config, relativePath);
    issues.push(...filteredIssues);
  }

  const result: ScanResult = {
    issues,
    filesScanned: files.length,
    passed: issues.filter(i => i.severity === 'error').length === 0
  };

  return result;
}

function filterIssues(issues: SecurityIssue[], config: ShieldTSConfig, filePath: string): SecurityIssue[] {
  return issues.filter(issue => {
    // Check ignored lines
    const lineIdentifier = `${filePath}:${issue.line}`;
    if (config.ignore?.lines?.includes(lineIdentifier)) {
      return false;
    }

    // Check ignored patterns - check the actual matched value if available, otherwise check snippet
    const textToCheck = (issue as any).matchedValue || issue.snippet;
    if (config.ignore?.patterns?.some(pattern => textToCheck.toLowerCase().includes(pattern.toLowerCase()))) {
      return false;
    }

    // Check severity settings
    if (issue.type === 'high-entropy' && config.severity?.highEntropy === 'off') {
      return false;
    }
    if (issue.type === 'known-pattern' && config.severity?.knownPatterns === 'off') {
      return false;
    }
    if (issue.type === 'base64-secret' && config.severity?.base64Secrets === 'off') {
      return false;
    }

    return true;
  });
}

export async function runShieldTS(projectRoot: string = process.cwd()): Promise<void> {
  console.log('[ShieldTS] Running security scan...\n');

  const result = await scan(projectRoot);

  // Generate HTML report
  const reportPath = path.join(projectRoot, 'shieldts-report.html');
  generateHTMLReport(result, reportPath);

  // Report to console
  reportToConsole(result);
}

export { ShieldTSConfig, SecurityIssue, ScanResult };
