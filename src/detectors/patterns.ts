export interface SecretPattern {
  name: string;
  provider: string;
  pattern: RegExp;
  description: string;
  riskLevel: 'critical' | 'high' | 'medium';
  educationalContent: string;
  bestPracticeLink: string;
}

export const SECRET_PATTERNS: SecretPattern[] = [
  // Supabase
  {
    name: 'Supabase Service Role Key',
    provider: 'supabase',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    description: 'Supabase service_role JWT token detected',
    riskLevel: 'critical',
    educationalContent: 'Service role keys bypass Row Level Security (RLS) and grant admin access to your entire database. Never expose these in client-side code.',
    bestPracticeLink: 'https://supabase.com/docs/guides/api/api-keys'
  },
  {
    name: 'Supabase Anonymous Key (in wrong context)',
    provider: 'supabase',
    pattern: /SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/,
    description: 'Supabase service role variable detected',
    riskLevel: 'critical',
    educationalContent: 'The service_role key should only be used in server-side code, never in client bundles.',
    bestPracticeLink: 'https://supabase.com/docs/guides/api/api-keys'
  },

  // Stripe
  {
    name: 'Stripe Live Secret Key',
    provider: 'stripe',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/,
    description: 'Stripe live secret key detected',
    riskLevel: 'critical',
    educationalContent: 'Stripe secret keys can charge customers, issue refunds, and access sensitive payment data. Never expose these client-side.',
    bestPracticeLink: 'https://stripe.com/docs/keys'
  },
  {
    name: 'Stripe Test Secret Key',
    provider: 'stripe',
    pattern: /sk_test_[0-9a-zA-Z]{24,}/,
    description: 'Stripe test secret key detected',
    riskLevel: 'high',
    educationalContent: 'Even test keys should not be exposed client-side as they reveal your Stripe integration patterns.',
    bestPracticeLink: 'https://stripe.com/docs/keys'
  },
  {
    name: 'Stripe Restricted Key',
    provider: 'stripe',
    pattern: /rk_(live|test)_[0-9a-zA-Z]{24,}/,
    description: 'Stripe restricted key detected',
    riskLevel: 'medium',
    educationalContent: 'Restricted keys should still be kept server-side to prevent abuse.',
    bestPracticeLink: 'https://stripe.com/docs/keys'
  },

  // AWS
  {
    name: 'AWS Access Key ID',
    provider: 'aws',
    pattern: /AKIA[0-9A-Z]{16}/,
    description: 'AWS Access Key ID detected',
    riskLevel: 'critical',
    educationalContent: 'AWS access keys provide programmatic access to your AWS resources. Exposed keys can lead to unauthorized resource usage and data breaches.',
    bestPracticeLink: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html'
  },
  {
    name: 'AWS Secret Access Key',
    provider: 'aws',
    pattern: /aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}/,
    description: 'AWS Secret Access Key detected',
    riskLevel: 'critical',
    educationalContent: 'Secret access keys must never be committed to code or exposed client-side. Use IAM roles or environment variables instead.',
    bestPracticeLink: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html'
  },

  // Firebase
  {
    name: 'Firebase API Key',
    provider: 'firebase',
    pattern: /AIza[0-9A-Za-z\-_]{35}/,
    description: 'Firebase/Google API Key detected',
    riskLevel: 'high',
    educationalContent: 'While Firebase API keys are meant for client use, ensure Firebase Security Rules are properly configured to prevent unauthorized access.',
    bestPracticeLink: 'https://firebase.google.com/docs/projects/api-keys'
  },
  {
    name: 'Firebase Service Account',
    provider: 'firebase',
    pattern: /"type":\s*"service_account"/,
    description: 'Firebase service account JSON detected',
    riskLevel: 'critical',
    educationalContent: 'Service account credentials grant full admin access to Firebase. Never commit these to version control or expose client-side.',
    bestPracticeLink: 'https://firebase.google.com/docs/admin/setup'
  },

  // Generic patterns
  {
    name: 'Generic API Key',
    provider: 'generic',
    pattern: /api[_-]?key[_-]?[=:]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/i,
    description: 'Generic API key pattern detected',
    riskLevel: 'high',
    educationalContent: 'API keys should be stored in environment variables and never hardcoded in source code.',
    bestPracticeLink: 'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'
  },
  {
    name: 'Generic Secret/Token',
    provider: 'generic',
    pattern: /(secret|token|password|passwd|pwd)[_-]?\s*[=:]\s*['"]([A-Za-z0-9_\-!@#$%^&*]{12,})['"]?/i,
    description: 'Generic secret pattern detected',
    riskLevel: 'high',
    educationalContent: 'Secrets should never be hardcoded. Use environment variables, secret managers, or secure vaults.',
    bestPracticeLink: 'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'
  },
  {
    name: 'Bearer Token',
    provider: 'generic',
    pattern: /[Bb]earer\s+[A-Za-z0-9\-\._~\+\/]+=*/,
    description: 'Bearer token detected',
    riskLevel: 'critical',
    educationalContent: 'Bearer tokens grant authenticated access. Never hardcode or expose them in client code.',
    bestPracticeLink: 'https://oauth.net/2/bearer-tokens/'
  },
  {
    name: 'Private Key',
    provider: 'generic',
    pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
    description: 'Private key detected',
    riskLevel: 'critical',
    educationalContent: 'Private keys should never be committed to version control. Use secure key management services.',
    bestPracticeLink: 'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'
  }
];
