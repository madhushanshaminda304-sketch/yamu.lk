export type ScamWarningCode = 'external_link_blocked' | 'advance_payment_scam_warning';

export interface ChatInspectionResult {
  allowed: boolean;
  sanitizedText: string;
  warningCode?: ScamWarningCode;
  warningMessage?: string;
}

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.(?:xyz|top|link|pay|click|online|net|com|lk)\/[^\s]*)/i;
const CARD_OR_ADVANCE_PATTERN = /\b(cvv|card\s*number|otp\s*code|western\s*union|crypto\s*deposit|pay\s*advance\s*link)\b/i;

export function inspectChatMessage(text: string): ChatInspectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { allowed: false, sanitizedText: '', warningMessage: 'Enter a message before sending.' };
  }

  if (URL_PATTERN.test(trimmed)) {
    return {
      allowed: false,
      sanitizedText: trimmed.replace(URL_PATTERN, '[link blocked]'),
      warningCode: 'external_link_blocked',
      warningMessage:
        'To avoid scams, never visit or send external links to pay or transfer money. Onboard rides are paid directly in Cash (LKR) or LankaQR when you meet.',
    };
  }

  if (CARD_OR_ADVANCE_PATTERN.test(trimmed)) {
    return {
      allowed: false,
      sanitizedText: trimmed,
      warningCode: 'advance_payment_scam_warning',
      warningMessage:
        'Security alert: Never ask for or share card numbers, CVVs, or OTPs. All contributions are settled in person during the ride.',
    };
  }

  return {
    allowed: true,
    sanitizedText: trimmed,
  };
}
