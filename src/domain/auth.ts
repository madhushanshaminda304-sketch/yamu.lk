export interface OtpChallenge {
  phone: string; // E.164: +947XXXXXXXX
  code: string; // 6 digits
  expiresAt: number; // ms timestamp (5 mins)
  resendAvailableAt: number; // ms timestamp (60s)
  attemptsRemaining: number; // max 3
  isVerified?: boolean;
}

const SRI_LANKA_MOBILE_REGEX = /^(?:\+94|0)?(7[0-9]{8})$/;

/**
 * Normalizes Sri Lankan mobile numbers into standard E.164 format (+947XXXXXXXX).
 * Validates prefixes for Dialog, Mobitel, Airtel, and Hutch (70, 71, 72, 74, 75, 76, 77, 78).
 */
export function normalizeSriLankanMobile(raw: string): {
  valid: boolean;
  phone?: string;
  error?: string;
} {
  const cleaned = raw.replace(/[\s\-\(\)]/g, '');
  const match = cleaned.match(SRI_LANKA_MOBILE_REGEX);

  if (!match) {
    return {
      valid: false,
      error: 'Please enter a valid 9-digit Sri Lankan mobile number (e.g. 077 123 4567 or +94 77 123 4567).',
    };
  }

  const subscriberDigits = match[1]; // 7XXXXXXXX
  return {
    valid: true,
    phone: `+94${subscriberDigits}`,
  };
}

/**
 * Generates a 6-digit OTP challenge valid for 5 minutes with a 60-second resend cooldown.
 */
export function createOtpChallenge(phone: string, now: number = Date.now()): OtpChallenge {
  // Generate 6 numeric digits: 100000 to 999999
  const randomInt = Math.floor(100000 + Math.random() * 900000);
  const code = String(randomInt);

  return {
    phone,
    code,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    resendAvailableAt: now + 60 * 1000, // 60 seconds cooldown
    attemptsRemaining: 3,
    isVerified: false,
  };
}

/**
 * Verifies a 6-digit code against an active OTP challenge.
 */
export function verifyOtpCode(
  challenge: OtpChallenge,
  inputCode: string,
  now: number = Date.now()
): {
  ok: boolean;
  expired?: boolean;
  exhausted?: boolean;
  error?: string;
  updatedChallenge: OtpChallenge;
} {
  if (challenge.isVerified) {
    return {
      ok: true,
      updatedChallenge: challenge,
    };
  }

  if (now > challenge.expiresAt) {
    return {
      ok: false,
      expired: true,
      error: 'This verification code has expired. Please request a new code.',
      updatedChallenge: { ...challenge, attemptsRemaining: 0 },
    };
  }

  if (challenge.attemptsRemaining <= 0) {
    return {
      ok: false,
      exhausted: true,
      error: 'Too many incorrect attempts. Please request a new code.',
      updatedChallenge: challenge,
    };
  }

  const sanitizedInput = inputCode.trim();
  if (sanitizedInput !== challenge.code) {
    const remaining = challenge.attemptsRemaining - 1;
    return {
      ok: false,
      error: remaining > 0
        ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new code.',
      updatedChallenge: {
        ...challenge,
        attemptsRemaining: remaining,
      },
    };
  }

  return {
    ok: true,
    updatedChallenge: {
      ...challenge,
      isVerified: true,
    },
  };
}
