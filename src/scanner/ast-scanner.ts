import * as ts from 'typescript';
import { SecurityIssue } from '../config/types';

/**
 * Scan TypeScript files using AST to detect client-side secrets
 * Identifies when server-only environment variables are used in client code
 */
export function scanFileWithAST(filePath: string, sourceCode: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Determine if this is a client-side file
  const isClientFile = isClientSideFile(filePath, sourceCode);

  if (!isClientFile) {
    return issues; // Server-side files are allowed to use secrets
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  function visit(node: ts.Node) {
    // Check for process.env access
    if (ts.isPropertyAccessExpression(node)) {
      const text = node.getText(sourceFile);

      // Check for non-public environment variables in client code
      if (text.startsWith('process.env.') && !text.includes('NEXT_PUBLIC_') && !text.includes('PUBLIC_')) {
        const envVarName = text.replace('process.env.', '');

        // Check if it looks like a secret
        if (isSecretLikeName(envVarName)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

          issues.push({
            type: 'client-side-secret',
            severity: 'error',
            file: filePath,
            line: line + 1,
            column: character + 1,
            message: `Server-only environment variable "${envVarName}" used in client-side code`,
            snippet: getSnippet(sourceFile, node),
            educationalContent: 'Server-only environment variables (without NEXT_PUBLIC_ prefix) should never be used in client-side code. These values are bundled into the JavaScript sent to browsers.',
            bestPracticeLink: 'https://nextjs.org/docs/app/building-your-application/configuring/environment-variables'
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return issues;
}

/**
 * Determine if a file is client-side based on path and imports
 */
function isClientSideFile(filePath: string, content: string): boolean {
  // Next.js patterns
  if (filePath.includes('/app/') && !filePath.endsWith('.server.ts') && !filePath.endsWith('.server.tsx')) {
    // Check for 'use client' directive
    if (content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"')) {
      return true;
    }
  }

  // Common client-side directories
  const clientPatterns = [
    '/components/',
    '/pages/',
    '/src/client/',
    '/public/',
  ];

  return clientPatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Check if environment variable name suggests it's a secret
 */
function isSecretLikeName(name: string): boolean {
  const secretKeywords = [
    'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE',
    'API_KEY', 'SERVICE_ROLE', 'ADMIN', 'CREDENTIAL',
    'AUTH', 'DATABASE_URL', 'DB_PASSWORD'
  ];

  return secretKeywords.some(keyword => name.toUpperCase().includes(keyword));
}

/**
 * Get code snippet around a node
 */
function getSnippet(sourceFile: ts.SourceFile, node: ts.Node): string {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const lines = sourceFile.text.split('\n');
  return lines[line]?.trim() || node.getText(sourceFile);
}
