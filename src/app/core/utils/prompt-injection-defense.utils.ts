export interface InjectionCheckResult {
  isSuspicious: boolean;
  action: 'allow' | 'contain' | 'block';
  detectedPatterns: string[];
  sanitizedText: string;
  boundedPrompt?: string;
}

export class PromptInjectionDefense {
  private static readonly SUSPICIOUS_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(above|previous)\s+instructions/i,
    /system\s+prompt/i,
    /you\s+are\s+now/i,
    /override\s+policy/i,
    /bypass\s+safety/i,
    /<\|im_start\|>/i,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /jailbreak/i,
    /DAN\s+mode/i,
    /forget\s+everything/i,
    /act\s+as\s+an?\s+unrestricted/i,
  ];

  /**
   * Inspects user input for injection attempts and sanitizes special characters
   */
  public static inspectAndSanitize(input: string): InjectionCheckResult {
    if (!input || typeof input !== 'string') {
      return {
        isSuspicious: false,
        action: 'allow',
        detectedPatterns: [],
        sanitizedText: ''
      };
    }

    const detectedPatterns: string[] = [];
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(input)) {
        detectedPatterns.push(pattern.source);
      }
    }

    // Sanitize markup characters to prevent breaking out of semantic XML tags
    const sanitizedText = input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();

    const isSuspicious = detectedPatterns.length > 0;
    const action = detectedPatterns.length >= 2 ? 'block' : (isSuspicious ? 'contain' : 'allow');

    return {
      isSuspicious,
      action,
      detectedPatterns,
      sanitizedText
    };
  }

  /**
   * Wraps untrusted user input within explicit semantic boundaries
   */
  public static wrapUntrustedContent(sanitizedText: string, label = 'user_input'): string {
    return `<untrusted_source_content label="${label}">\n${sanitizedText}\n</untrusted_source_content>`;
  }
}

export interface PromptInjectionInspection {
  isMalicious: boolean;
  reason?: string;
  detectedPatterns: string[];
}

export function detectPromptInjection(payload: string): PromptInjectionInspection {
  const result = PromptInjectionDefense.inspectAndSanitize(payload);
  const isMalicious = result.isSuspicious;
  const reason = isMalicious
    ? `Prompt injection pattern detected: ${result.detectedPatterns.join(', ')}`
    : undefined;
  return {
    isMalicious,
    reason,
    detectedPatterns: result.detectedPatterns
  };
}

export function sanitizePromptInput(input: string): string {
  const result = PromptInjectionDefense.inspectAndSanitize(input);
  return result.sanitizedText;
}
