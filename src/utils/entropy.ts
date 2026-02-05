/**
 * Calculate Shannon Entropy of a string
 * Returns a value typically between 0-8, where higher = more random
 * API keys and secrets typically have entropy > 4.5
 */
export function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const frequencies = new Map<string, number>();

  // Count character frequencies
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  // Calculate entropy using Shannon's formula
  let entropy = 0;
  const len = str.length;

  for (const count of frequencies.values()) {
    const probability = count / len;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Check if a string is likely a high-entropy secret
 */
export function isHighEntropyString(str: string, threshold: number = 4.5, minLength: number = 20): boolean {
  if (str.length < minLength) return false;

  const entropy = calculateEntropy(str);
  return entropy >= threshold;
}

/**
 * Check if string contains common placeholder patterns
 */
export function isPlaceholder(str: string): boolean {
  const placeholderPatterns = [
    /^(xxx|yyy|zzz)/i,
    /^(your|my)[-_]?(api)?[-_]?key/i,
    /^(example|test|demo|mock|fake|placeholder)/i,
    /<.*>/,  // <YOUR_API_KEY>
    /\{.*\}/,  // {API_KEY}
    /^(123|abc|test)/i
  ];

  return placeholderPatterns.some(pattern => pattern.test(str));
}
