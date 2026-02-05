import * as fs from 'fs';
import { SecurityIssue } from '../config/types';
import { SECRET_PATTERNS } from '../detectors/patterns';
import { isPlaceholder } from '../utils/entropy';

export function scanFileForPatterns(filePath: string, content: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  for (const pattern of SECRET_PATTERNS) {
    const matches = content.matchAll(new RegExp(pattern.pattern, 'g'));

    for (const match of matches) {
      if (!match.index) continue;

      const matchedText = match[0];

      // Skip if it's a known placeholder
      if (isPlaceholder(matchedText)) continue;

      // Find line and column
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const columnNumber = match.index - beforeMatch.lastIndexOf('\n');

      const snippet = lines[lineNumber - 1]?.trim() || matchedText;

      issues.push({
        type: 'known-pattern',
        severity: pattern.riskLevel === 'medium' ? 'warning' : 'error',
        file: filePath,
        line: lineNumber,
        column: columnNumber,
        message: `${pattern.name}: ${pattern.description}`,
        snippet,
        provider: pattern.provider,
        educationalContent: pattern.educationalContent,
        bestPracticeLink: pattern.bestPracticeLink
      });
    }
  }

  return issues;
}
