import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, DeviceMobile, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import type { MarketplaceStore } from '../state/store.ts';

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  store,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  store: MarketplaceStore;
}) {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setPhone('');
      setOtpDigits(['', '', '', '', '', '']);
      setFullName('');
      setNicNumber('');
      setErrorMsg('');
      setCooldown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    const res = store.requestPhoneOtp(phone);
    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to send OTP code.');
      return;
    }

    setCooldown(60);
    setStep('otp');
    setOtpDigits(['', '', '', '', '', '']);

    const generatedCode = res.code || '';
    toast.info('Verification Code Sent', {
      description: `Your OTP is ${generatedCode} (Simulated SMS to Sri Lankan mobile).`,
      action: {
        label: 'Auto-fill',
        onClick: () => {
          if (generatedCode.length === 6) {
            setOtpDigits(generatedCode.split(''));
          }
        },
      },
      duration: 15000,
    });
  };

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (char && !/^[0-9]$/.test(char)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setErrorMsg('');

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    const res = store.verifyPhoneOtp(fullCode);
    if (!res.ok) {
      setErrorMsg(res.error || 'Incorrect verification code.');
      return;
    }

    if (res.isNewUser) {
      setStep('profile');
    } else {
      toast.success('Signed in successfully!', {
        description: 'Your Sri Lankan phone number is verified.',
      });
      onSuccess?.();
      onClose();
    }
  };

  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = store.completeRegistration(fullName, nicNumber);
    if (!res.ok) {
      setErrorMsg(res.error || 'Failed to complete registration.');
      return;
    }

    toast.success('Account created and verified!', {
      description: 'Welcome to Yamu.',
    });
    onSuccess?.();
    onClose();
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close dialog">
          <X size={20} weight="bold" />
        </button>

        {step === 'phone' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="auth-icon-badge">
                <DeviceMobile size={28} color="var(--bbc-blue)" weight="duotone" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--bbc-navy)', marginTop: '12px' }}>
                Sign In to Yamu
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--bbc-text-secondary)', marginTop: '6px' }}>
                Enter your Sri Lankan mobile number to receive a secure 6-digit login code.
              </p>
            </div>

            {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

            <form onSubmit={handleSendOtp}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--bbc-navy)', marginBottom: '6px' }}>
                Sri Lankan Mobile Number
              </label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <span className="auth-prefix-badge">
                  🇱🇰 +94
                </span>
                <input
                  type="tel"
                  placeholder="077 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="auth-input-field"
                  autoFocus
                  required
                />
              </div>

              <button type="submit" className="auth-primary-btn">
                Send Verification Code
              </button>
            </form>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--bbc-text-muted)' }}>
              <ShieldCheck size={16} color="var(--bbc-green)" weight="fill" />
              <span>No password needed. Verified via secure Sri Lankan SMS OTP.</span>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div>
            <button
              className="auth-back-btn"
              onClick={() => {
                setStep('phone');
                setErrorMsg('');
              }}
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Change phone number</span>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--bbc-navy)' }}>
                Enter Verification Code
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--bbc-text-secondary)', marginTop: '6px' }}>
                Sent to <strong>{phone}</strong>
              </p>
            </div>

            {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

            <form onSubmit={handleVerifyOtp}>
              <div className="otp-digit-row" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="otp-digit-box"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <button type="submit" className="auth-primary-btn" style={{ marginTop: '20px' }}>
                Verify & Continue
              </button>
            </form>

            <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '13px' }}>
              {cooldown > 0 ? (
                <span style={{ color: 'var(--bbc-text-muted)' }}>
                  Resend code in <strong>0:{cooldown < 10 ? `0${cooldown}` : cooldown}</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  style={{ background: 'none', border: 'none', color: 'var(--bbc-blue)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Resend verification code
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'profile' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="auth-icon-badge" style={{ background: '#e8f5e9' }}>
                <CheckCircle size={28} color="var(--bbc-green)" weight="fill" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--bbc-navy)', marginTop: '12px' }}>
                Complete Your Profile
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--bbc-text-secondary)', marginTop: '6px' }}>
                Welcome to Yamu! Set your name so co-travellers can identify you.
              </p>
            </div>

            {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

            <form onSubmit={handleCompleteRegistration}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--bbc-navy)', marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kasun Fernando"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="auth-input-field"
                  style={{ width: '100%' }}
                  autoFocus
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--bbc-navy)', marginBottom: '6px' }}>
                  National Identity Card (NIC) <span style={{ color: 'var(--bbc-text-muted)', fontWeight: 400 }}>(Optional, unlocks Verified badge)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 199614502341 or 961452341V"
                  value={nicNumber}
                  onChange={(e) => setNicNumber(e.target.value.toUpperCase())}
                  className="auth-input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <button type="submit" className="auth-primary-btn">
                Complete Account & Sign In
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
