import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "./hooks/useAuth";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { AlertCircle, Loader2, CheckCircle2 } from "@/components/shared/icons";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/types/api";

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { verifyOtp, resendOtp, logout, verifyOtpMutation, resendOtpMutation } =
    useAuth();

  // Determine email target from auth state or route state
  const targetEmail =
    user?.email || (location.state as { email?: string })?.email || "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccessSplash, setIsSuccessSplash] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Persistent 60-second cooldown timer synced with localStorage
  const cooldownStorageKey = targetEmail
    ? `dakhli_otp_cooldown_${targetEmail.toLowerCase().trim()}`
    : "dakhli_otp_cooldown_default";

  const getInitialCooldown = (): number => {
    try {
      const stored = localStorage.getItem(cooldownStorageKey);
      if (stored) {
        const expiry = parseInt(stored, 10);
        const remaining = Math.ceil((expiry - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
    } catch {
      // Ignore localStorage read errors
    }
    return 0;
  };

  const [cooldown, setCooldown] = useState<number>(getInitialCooldown);

  // Focus the first empty input cell on mount
  useEffect(() => {
    const firstEmptyIndex = digits.findIndex((d) => !d);
    const indexToFocus = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
    inputRefs.current[indexToFocus]?.focus();
  }, []);

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(cooldownStorageKey);
          } catch {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown, cooldownStorageKey]);

  // If user is already authenticated and verified, redirect to dashboard immediately
  if (!isAuthLoading && isAuthenticated && user?.isVerified === true) {
    return <Navigate to="/dashboard" replace />;
  }

  // If unauthenticated and no target email in state, redirect to login
  if (!isAuthLoading && !isAuthenticated && !targetEmail) {
    return <Navigate to="/login" replace />;
  }

  // Handle OTP submission
  const handleVerify = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || digits.join("");
    if (fullCode.length !== 6 || !/^\d{6}$/.test(fullCode)) {
      setErrorMessage("Please enter all 6 digits.");
      return;
    }

    if (!targetEmail) {
      setErrorMessage("No target email found. Please register or log in again.");
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      await verifyOtp({
        email: targetEmail,
        otp: fullCode,
      });

      // Clear any cooldown on successful verification
      try {
        localStorage.removeItem(cooldownStorageKey);
      } catch {
        // ignore
      }

      setIsSuccessSplash(true);
      setTimeout(() => {
        const destination =
          (location.state as { from?: Location })?.from?.pathname || "/dashboard";
        navigate(destination, { replace: true });
      }, 850);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(
        apiErr?.message || "Invalid verification code. Please try again."
      );

      // Trigger shake animation and reset cells on error
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  // Handle input changes per cell
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric inputs
    const numericChar = value.replace(/\D/g, "");
    if (!numericChar) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    const digit = numericChar.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance to next cell
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when 6th digit is entered
    const completeCode = newDigits.join("");
    if (completeCode.length === 6) {
      void handleVerify(completeCode);
    }
  };

  // Handle Backspace and Arrow navigation
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current is empty, shift focus to previous and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current cell
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Clipboard Paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const cleanedDigits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (cleanedDigits.length === 6) {
      const splitDigits = cleanedDigits.split("");
      setDigits(splitDigits);
      setErrorMessage(null);
      inputRefs.current[5]?.focus();
      void handleVerify(cleanedDigits);
    } else if (cleanedDigits.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < cleanedDigits.length; i++) {
        newDigits[i] = cleanedDigits[i];
      }
      setDigits(newDigits);
      const nextIndex = Math.min(cleanedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Handle Resend Request
  const handleResend = async () => {
    if (cooldown > 0 || resendOtpMutation.isPending || !targetEmail) return;

    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await resendOtp(targetEmail);
      const newExpiry = Date.now() + 60000;
      try {
        localStorage.setItem(cooldownStorageKey, newExpiry.toString());
      } catch {
        // ignore
      }
      setCooldown(60);
      setSuccessNotice(res.message || "A new 6-digit code has been dispatched.");
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMessage(
        apiErr?.message || "Failed to resend code. Please try again."
      );
    }
  };

  // Handle Sign Out & Register Again
  const handleSignOutAndRegister = () => {
    logout();
    navigate("/register", { replace: true });
  };

  if (isSuccessSplash) {
    return <SplashScreen message="Email verified! Initializing financial OS..." />;
  }

  const isVerifying = verifyOtpMutation.isPending;
  const isResending = resendOtpMutation.isPending;

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0D0E12] text-white flex items-center justify-center p-4 select-none">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>

      {/* Main Card Container */}
      <div
        className={cn(
          "w-full max-w-[420px] bg-[#13151B] border border-white/[0.05] rounded-2xl p-7 sm:p-9 shadow-2xl relative transition-transform duration-200",
          isShaking && "animate-shake border-red-500/40"
        )}
      >
        {/* Top Brand Mark */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-md bg-[#E5A855]/15 border border-[#E5A855]/30 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-3 h-3 text-[#E5A855]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
            DAKHLI // SECURITY CHECK
          </span>
        </div>

        {/* Heading & Subtext */}
        <div className="mb-6">
          <h1 className="text-xl font-medium text-white tracking-tight">
            Verify your email
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            We sent a 6-digit verification code to{" "}
            <span className="font-mono text-white font-medium break-all">
              {targetEmail || "your email address"}
            </span>
            . Enter the code below to activate your account.
          </p>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successNotice && (
          <div className="mb-5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* 6-Digit Monospace Split Inputs */}
        <div className="flex items-center justify-between gap-2 sm:gap-2.5 my-6">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={isVerifying}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={cn(
                "w-11 h-13 sm:w-12 sm:h-14 bg-[#1A1D26] border rounded-lg text-center text-2xl font-mono text-white select-none transition-all outline-none",
                digit
                  ? "border-white/20 bg-[#1e222d]"
                  : "border-white/5 hover:border-white/10",
                "focus:border-[#E5A855]/60 focus:ring-1 focus:ring-[#E5A855]/20 focus:bg-[#202431]",
                isVerifying && "opacity-50 cursor-not-allowed"
              )}
            />
          ))}
        </div>

        {/* Verification Submit Button */}
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isVerifying || digits.join("").length !== 6}
          className="w-full h-10 rounded-xl bg-[#E5A855] hover:bg-[#d99b48] active:scale-[0.99] text-[#121316] font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-mono"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#121316]" />
              <span>Verifying code...</span>
            </>
          ) : (
            <span>Verify & Access OS →</span>
          )}
        </button>

        {/* Cooldown & Resend Controls */}
        <div className="mt-5 text-center flex items-center justify-center gap-1">
          {cooldown > 0 ? (
            <span className="text-slate-500 font-mono text-xs">
              Resend code in 00:{cooldown.toString().padStart(2, "0")}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-slate-300 hover:text-white font-mono text-xs underline-offset-4 hover:underline transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isResending && (
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              )}
              <span>Resend code</span>
            </button>
          )}
        </div>

        {/* Secondary Action: Wrong email */}
        <div className="mt-6 pt-4 border-t border-white/[0.04] text-center">
          <button
            type="button"
            onClick={handleSignOutAndRegister}
            className="text-slate-500 hover:text-slate-300 text-xs font-mono transition-colors cursor-pointer"
          >
            Wrong email? Sign out and register again &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

