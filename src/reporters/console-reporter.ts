import chalk from 'chalk';
import { SecurityIssue, ScanResult } from '../config/types';

export function reportToConsole(result: ScanResult): void {
  console.log('\n' + chalk.bold('==================================='));
  console.log(chalk.bold('  ShieldTS Security Scan Results'));
  console.log(chalk.bold('===================================\n'));

  if (result.passed) {
    console.log(chalk.green('[PASS] No security issues found'));
    console.log(chalk.gray(`Scanned ${result.filesScanned} files\n`));
    return;
  }

  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');

  console.log(chalk.red(`[FAIL] Found ${errors.length} error(s) and ${warnings.length} warning(s)\n`));

  // Group by file
  const issuesByFile = new Map<string, SecurityIssue[]>();
  for (const issue of result.issues) {
    if (!issuesByFile.has(issue.file)) {
      issuesByFile.set(issue.file, []);
    }
    issuesByFile.get(issue.file)!.push(issue);
  }

  // Print issues grouped by file
  for (const [file, issues] of issuesByFile) {
    console.log(chalk.bold.underline(file));

    for (const issue of issues) {
      const icon = issue.severity === 'error' ? chalk.red('[ERROR]') : chalk.yellow('[WARN]');
      const location = chalk.gray(`${issue.line}:${issue.column}`);
      const severityColor = issue.severity === 'error' ? chalk.red : chalk.yellow;

      console.log(`  ${icon} ${location} ${severityColor(issue.message)}`);
      console.log(chalk.gray(`      ${issue.snippet}`));

      if (issue.provider) {
        console.log(chalk.cyan(`      Provider: ${issue.provider}`));
      }

      console.log('');
    }
  }

  console.log(chalk.bold('\n--- RECOMMENDED ACTIONS ---\n'));
  console.log('  1. Review and remove hardcoded secrets from your code');
  console.log('  2. Move secrets to environment variables (.env files)');
  console.log('  3. Use the .shieldtsrc file to add exceptions if needed');
  console.log('  4. Run the scan again to verify\n');

  console.log(chalk.gray('>> A detailed HTML report has been generated: shieldts-report.html\n'));

  // Exit with error code
  process.exit(1);
}
