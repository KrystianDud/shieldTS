import { SecurityIssue } from '../config/types';
import { decodeAndCheckBase64 } from '../utils/base64-decoder';

export function scanFileForBase64Secrets(filePath: string, content: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  // Match potential Base64 strings (at least 20 chars)
  const base64Pattern = /['"`]([A-Za-z0-9+/]{20,}={0,2})['"`]/g;
  const matches = content.matchAll(base64Pattern);

  for (const match of matches) {
    if (!match.index) continue;

    const potentialBase64 = match[1];
    const result = decodeAndCheckBase64(potentialBase64);

    if (result.isSecret && result.keywords) {
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const columnNumber = match.index - beforeMatch.lastIndexOf('\n');

      const snippet = lines[lineNumber - 1]?.trim() || potentialBase64.substring(0, 50) + '...';

      issues.push({
        type: 'base64-secret',
        severity: 'warning',
        file: filePath,
        line: lineNumber,
        column: columnNumber,
        message: `Base64-encoded secret detected (contains keywords: ${result.keywords.join(', ')})`,
        snippet,
        educationalContent: 'Base64 encoding is not encryption. Secrets encoded in Base64 can be easily decoded. Use proper secret management instead.',
        bestPracticeLink: 'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'
      });
    }
  }

  return issues;
}
