import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "@/components/shared/icons";
import { useAuth } from "./hooks/useAuth";
import { useGoogleAuth, type GoogleAuthPayload } from "./hooks/useGoogleAuth";
import { authApi, isDeactivatedResponse } from "./api/authApi";
import { cn } from "@/lib/utils";
import { AuthPromoBanner } from "./components/AuthPromoBanner";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { useFormValidation } from "@/hooks/useFormValidation";
import { loginSchema, registerSchema } from "./schemas/authSchemas";
import type { ApiError } from "@/types/api";

export interface AuthPageProps {
  initialMode?: "login" | "register" | "signin" | "signup";
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, googleAuth, loginMutation, registerMutation, googleAuthMutation } = useAuth();

  // Normalize initial mode to 'login' or 'register'
  const resolveMode = () => {
    if (initialMode === "register" || initialMode === "signup")
      return "register";
    if (initialMode === "login" || initialMode === "signin") return "login";
    return location.pathname === "/register" ? "register" : "login";
  };

  const [mode, setMode] = useState<"login" | "register">(resolveMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccessSplash, setIsSuccessSplash] = useState(false);
  const [splashMessage, setSplashMessage] = useState("Loading Your Account...");

  // Real-time email availability status for register mode
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    available: boolean;
    message: string;
    isGoogleAccount?: boolean;
  } | null>(null);

  // Form validation hook with real-time & on-blur validation
  const {
    values,
    errors,
    touched,
    generalError,
    handleChange,
    handleBlur,
    validate,
    setServerErrors,
    setFieldError,
    setGeneralError,
    reset,
  } = useFormValidation(
    mode === "login" ? loginSchema : registerSchema,
    {
      name: "",
      email: "",
      password: "",
    },
    { validateOnChange: true, validateOnBlur: true }
  );

  // Forward declare Google error reset for mode switch
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

  const handleModeSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    setEmailStatus(null);
    setIsCheckingEmail(false);
    setGoogleAuthError(null);
    reset({
      name: "",
      email: values.email, // preserve already typed email
      password: "",
    });
  };

  // Debounced real-time email availability check for registration
  useEffect(() => {
    const trimmedEmail = values.email.trim();
    if (mode !== "register" || !trimmedEmail) {
      setEmailStatus(null);
      setIsCheckingEmail(false);
      return;
    }

    // Basic format check before querying pre-flight endpoint
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailStatus(null);
      setIsCheckingEmail(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsCheckingEmail(true);
        const res = await authApi.checkEmail(trimmedEmail);
        if (!isMounted) return;

        if (!res.available) {
          setEmailStatus({
            available: false,
            message: res.isGoogleAccount
              ? "This email is registered with Google. Use Google login below."
              : "This email is already registered. Log in instead.",
            isGoogleAccount: res.isGoogleAccount,
          });
          setFieldError(
            "email",
            res.isGoogleAccount
              ? "Account registered via Google OAuth. Please sign in with Google."
              : "This email is already registered. Please log in instead."
          );
        } else {
          setEmailStatus({
            available: true,
            message: "Email is available",
          });
          if (
            errors.email?.includes("already registered") ||
            errors.email?.includes("Google")
          ) {
            setFieldError("email", undefined);
          }
        }
      } catch {
        // Pre-flight check failure shouldn't block the user
      } finally {
        if (isMounted) {
          setIsCheckingEmail(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [values.email, mode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger validation
    const isValid = validate();
    if (!isValid) return;

    if (mode === "register" && emailStatus && !emailStatus.available) {
      setFieldError(
        "email",
        emailStatus.isGoogleAccount
          ? "Account registered via Google OAuth. Please sign in with Google."
          : "This email is already registered. Please log in instead."
      );
      return;
    }

    try {
      const destination =
        (location.state as { from?: Location })?.from?.pathname || "/";
      if (mode === "login") {
        const loginData = await login({ email: values.email.trim(), password: values.password });

        // Intercept deactivated account in grace period
        if (isDeactivatedResponse(loginData)) {
          try {
            sessionStorage.setItem('dakhli_restoration', JSON.stringify(loginData));
          } catch {
            // ignore storage quota error
          }
          navigate("/account-deactivated", {
            replace: true,
            state: {
              email: loginData.email,
              name: loginData.name,
              deletionScheduledAt: loginData.deletionScheduledAt,
              restorationToken: loginData.restorationToken,
            },
          });
          return;
        }

        if (loginData.user.isVerified === false) {
          setSplashMessage("Please verify your email address...");
          setIsSuccessSplash(true);
          setTimeout(() => {
            navigate("/verify-email", { replace: true, state: { email: values.email.trim() } });
          }, 850);
          return;
        }
        setSplashMessage("Welcome back! Loading your account...");
      } else {
        await register({
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password,
        });
        setSplashMessage("Account created! Please verify your email...");
        setIsSuccessSplash(true);
        setTimeout(() => {
          navigate("/verify-email", { replace: true, state: { email: values.email.trim() } });
        }, 850);
        return;
      }

      setIsSuccessSplash(true);
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 850);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.fieldErrors && Object.keys(apiErr.fieldErrors).length > 0) {
        setServerErrors(apiErr.fieldErrors, apiErr.message);
      } else {
        setGeneralError(
          apiErr?.message ||
            "Authentication failed. Please verify your credentials."
        );
      }
    }
  };

  // Google OAuth / Real Authentication Handler
  const handleGoogleAuthSuccess = async (payload: GoogleAuthPayload) => {
    try {
      setGeneralError(null);
      setGoogleAuthError(null);
      const googleData = await googleAuth(payload);

      // Intercept deactivated account in grace period
      if (isDeactivatedResponse(googleData)) {
        try {
          sessionStorage.setItem('dakhli_restoration', JSON.stringify(googleData));
        } catch {
          // ignore storage quota error
        }
        navigate("/account-deactivated", {
          replace: true,
          state: {
            email: googleData.email,
            name: googleData.name,
            deletionScheduledAt: googleData.deletionScheduledAt,
            restorationToken: googleData.restorationToken,
          },
        });
        return;
      }

      setSplashMessage("Welcome back! Loading your account...");
      setIsSuccessSplash(true);
      setTimeout(() => {
        const destination =
          (location.state as { from?: Location })?.from?.pathname || "/";
        navigate(destination, { replace: true });
      }, 850);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const message = apiErr?.message || "Google authentication failed. Please try again.";
      setGeneralError(message);
      throw err;
    }
  };

  const {
    triggerGoogleLogin,
    isGoogleLoading,
    googleError,
  } = useGoogleAuth({
    onSuccess: handleGoogleAuthSuccess,
  });

  // Combined loading state for form and Google OAuth
  const isLoading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    googleAuthMutation.isPending ||
    isGoogleLoading;

  if (isSuccessSplash) {
    return <SplashScreen message={splashMessage} />;
  }

  const isAccountNotFound =
    mode === "login" &&
    (generalError?.toLowerCase().includes("not found") ||
      errors.email?.toLowerCase().includes("not found") ||
      errors.email?.toLowerCase().includes("create an account"));

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0D0E12] text-white flex flex-col lg:flex-row select-none">
      {/* ================= LEFT COLUMN: Form Area (35% width, strictly no scroll) ================= */}
      <div className="w-full lg:w-[35%] flex-shrink-0 h-full flex flex-col justify-between px-6 sm:px-8 xl:px-10 py-5 sm:py-6 bg-[#13151B] border-r border-white/[0.06] overflow-hidden">
        {/* Top: Brand Header */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-md bg-[#E5A855]/15 border border-[#E5A855]/30 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 text-[#E5A855]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-white">
            Dakhli
          </span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">
            Financial OS
          </span>
        </div>

        {/* Center: Minimalist Form */}
        <div className="w-full max-w-[340px] sm:max-w-[350px] mx-auto my-auto flex flex-col justify-center">
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-[11.5px] text-slate-400 mt-1">
              {mode === "login"
                ? "Enter your credentials to access your financial system."
                : "Start tracking liquidity, savings, and overheads in one hub."}
            </p>
          </div>

          {/* Segmented Switcher: Login / Register */}
          <div className="grid grid-cols-2 p-0.5 bg-[#1A1D26] border border-white/[0.08] rounded-xl w-full mt-3.5">
            <button
              type="button"
              onClick={() => handleModeSwitch("login")}
              className={cn(
                "py-1.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer",
                mode === "login"
                  ? "bg-[#242835] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("register")}
              className={cn(
                "py-1.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer",
                mode === "register"
                  ? "bg-[#242835] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              Register
            </button>
          </div>

          {/* General / Server Error Banner */}
          {(googleError || googleAuthError || generalError) && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex flex-col gap-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{googleError || googleAuthError || generalError}</span>
              </div>
              {isAccountNotFound && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch("register")}
                  className="text-left text-[11px] text-[#E5A855] hover:underline font-semibold pl-5 cursor-pointer font-mono"
                >
                  Need an account? Click here to register →
                </button>
              )}
            </div>
          )}

          {/* Input Fields */}
          <form onSubmit={handleSubmit} noValidate className="mt-3.5 space-y-2.5">
            {/* Full Name (Register only) */}
            {mode === "register" && (
              <div className="space-y-1 animate-in fade-in duration-200">
                <label className="text-[11px] font-medium text-slate-300">
                  Full Name
                </label>
                <div
                  className={cn(
                    "bg-[#1A1D26] border rounded-xl h-9 sm:h-10 px-3 flex items-center gap-2.5 transition-colors",
                    errors.name && (touched.name || errors.name)
                      ? "border-red-500/60 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30"
                      : "border-white/[0.08] focus-within:border-[#E5A855] focus-within:ring-1 focus-within:ring-[#E5A855]/30"
                  )}
                >
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={values.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    placeholder="Anna Watson"
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
                {errors.name && (touched.name || errors.name) && (
                  <p className="text-[10.5px] text-red-400 font-medium pl-1">
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300">
                  Email Address
                </label>
                {mode === "register" && isCheckingEmail && (
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> checking...
                  </span>
                )}
                {mode === "register" && !isCheckingEmail && emailStatus?.available && !errors.email && (
                  <span className="text-[10px] font-mono font-medium text-emerald-400 flex items-center gap-0.5">
                    ✓ Available
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "bg-[#1A1D26] border rounded-xl h-9 sm:h-10 px-3 flex items-center gap-2.5 transition-colors",
                  errors.email && (touched.email || errors.email)
                    ? "border-red-500/60 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30"
                    : emailStatus?.available && !errors.email
                    ? "border-emerald-500/40 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30"
                    : "border-white/[0.08] focus-within:border-[#E5A855] focus-within:ring-1 focus-within:ring-[#E5A855]/30"
                )}
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="name@example.com"
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                />
                {isCheckingEmail && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 flex-shrink-0" />
                )}
              </div>
              {errors.email && (touched.email || errors.email) && (
                <div className="flex items-center justify-between text-[10.5px] text-red-400 font-medium pl-1">
                  <span>{errors.email}</span>
                  {mode === "register" && emailStatus && !emailStatus.available && (
                    <button
                      type="button"
                      onClick={() => handleModeSwitch("login")}
                      className="text-[#E5A855] hover:underline font-mono text-[10.5px] font-semibold ml-2 cursor-pointer flex-shrink-0"
                    >
                      Log in →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-300">
                Password
              </label>
              <div
                className={cn(
                  "bg-[#1A1D26] border rounded-xl h-9 sm:h-10 px-3 flex items-center gap-2.5 transition-colors",
                  errors.password && (touched.password || errors.password)
                    ? "border-red-500/60 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/30"
                    : "border-white/[0.08] focus-within:border-[#E5A855] focus-within:ring-1 focus-within:ring-[#E5A855]/30"
                )}
              >
                <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder={
                    mode === "login" ? "••••••••" : "Minimum 8 characters"
                  }
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              {errors.password && (touched.password || errors.password) && (
                <p className="text-[10.5px] text-red-400 font-medium pl-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 sm:h-10 rounded-xl bg-[#E5A855] hover:bg-[#d99b48] active:scale-[0.99] text-[#121316] font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50 font-mono"
            >
              {loginMutation.isPending || registerMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#121316]" />
              ) : (
                <span>{mode === "login" ? "Login" : "Create Account"}</span>
              )}
            </button>
          </form>

          {/* Clean Divider */}
          <div className="relative my-3 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <span className="relative bg-[#13151B] px-2 text-[10px] uppercase font-mono tracking-wider text-slate-500">
              or
            </span>
          </div>

          {/* Google Only Login Button */}
          <button
            type="button"
            onClick={triggerGoogleLogin}
            disabled={isLoading}
            className="w-full h-9 sm:h-10 rounded-xl bg-[#1A1D26] hover:bg-[#222633] border border-white/10 hover:border-white/20 flex items-center justify-center gap-2.5 text-xs font-medium text-white transition-all cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            {googleAuthMutation.isPending || isGoogleLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 flex-shrink-0"
                  aria-hidden="true"
                >
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.7 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom: Footer */}
        <div className="pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
          <span className="font-mono">© Dakhli</span>
          <div className="flex items-center gap-3">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">
              Terms
            </span>
            <span>·</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">
              Privacy
            </span>
          </div>
        </div>
      </div>

      {/* ================= RIGHT COLUMN: Hero Promo Area (65% width) ================= */}
      <AuthPromoBanner />
    </div>
  );
};

export default AuthPage;
