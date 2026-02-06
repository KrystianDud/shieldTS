import { SecurityIssue } from '../config/types';
import { isHighEntropyString, isPlaceholder } from '../utils/entropy';

export function scanFileForHighEntropy(
  filePath: string,
  content: string,
  threshold: number = 4.5,
  minLength: number = 20
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  // Match string literals and assignments
  const stringPatterns = [
    /'([^']{20,})'/g,  // Single quotes
    /"([^"]{20,})"/g,  // Double quotes
    /`([^`]{20,})`/g   // Template literals
  ];

  for (const pattern of stringPatterns) {
    const matches = content.matchAll(pattern);

    for (const match of matches) {
      if (match.index === undefined) continue;

      const stringValue = match[1];

      // Skip obvious non-secrets
      if (shouldSkipString(stringValue)) continue;

      // Check if high entropy
      if (isHighEntropyString(stringValue, threshold, minLength)) {
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const columnNumber = match.index - beforeMatch.lastIndexOf('\n');

        const snippet = lines[lineNumber - 1]?.trim() || stringValue;

        issues.push({
          type: 'high-entropy',
          severity: 'error',
          file: filePath,
          line: lineNumber,
          column: columnNumber,
          message: `High-entropy string detected (possible secret or API key)`,
          snippet,
          educationalContent: 'This string has high randomness, which is typical of API keys, tokens, or secrets. If this is a legitimate secret, move it to environment variables.',
          bestPracticeLink: 'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
          matchedValue: stringValue
        } as any);
      }
    }
  }

  return issues;
}

/**
 * Check if a string should be skipped (obviously not a secret)
 */
function shouldSkipString(str: string): boolean {
  // Skip if it's a known placeholder
  if (isPlaceholder(str)) return true;

  // Skip sentences (multiple words with spaces)
  if (str.includes(' ') && str.split(' ').length > 2) return true;

  // Skip file paths (contains / or \\ and common extensions)
  if (/[\/\\]/.test(str) && /\.(tsx?|jsx?|css|s?css|json|html?|svg|png|jpg|gif|woff2?|ttf|eot)/.test(str)) return true;

  // Skip relative/absolute import paths
  if (str.startsWith('./') || str.startsWith('../') || str.startsWith('@/')) return true;

  // Skip well-known URLs and namespaces
  if (str.includes('w3.org') || str.includes('xmlns') || str.includes('http://') || str.includes('https://')) return true;

  // Skip common CSS/HTML patterns
  if (str.includes('viewBox') || str.includes('xmlns')) return true;

  // Skip strings that are mostly lowercase with common words
  const commonWords = ['component', 'navbar', 'styles', 'module', 'page', 'layout', 'import', 'export'];
  if (commonWords.some(word => str.toLowerCase().includes(word))) return true;

  return false;
}
