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
      if (!match.index) continue;

      const stringValue = match[1];

      // Skip if it's a placeholder or common non-secret string
      if (isPlaceholder(stringValue)) continue;
      if (stringValue.includes(' ') && stringValue.split(' ').length > 3) continue; // Skip sentences

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
