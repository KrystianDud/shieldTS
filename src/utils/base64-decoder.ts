/**
 * Check if a string is valid Base64
 */
export function isBase64(str: string): boolean {
  if (!str || str.length < 20) return false;

  // Basic Base64 regex pattern
  const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Pattern.test(str);
}

/**
 * Attempt to decode Base64 and check for secret-like content
 */
export function decodeAndCheckBase64(str: string): { isSecret: boolean; decoded?: string; keywords?: string[] } {
  if (!isBase64(str)) {
    return { isSecret: false };
  }

  try {
    const decoded = Buffer.from(str, 'base64').toString('utf-8');

    // Keywords that indicate this might be a secret
    const secretKeywords = [
      'password', 'passwd', 'pwd',
      'secret', 'private', 'key',
      'token', 'api', 'auth',
      'credential', 'access',
      'service_role', 'admin'
    ];

    const foundKeywords = secretKeywords.filter(keyword =>
      decoded.toLowerCase().includes(keyword)
    );

    if (foundKeywords.length > 0) {
      return {
        isSecret: true,
        decoded: decoded.substring(0, 100), // Limit output
        keywords: foundKeywords
      };
    }

    return { isSecret: false };
  } catch {
    // Not valid Base64 or not UTF-8 decodable
    return { isSecret: false };
  }
}
