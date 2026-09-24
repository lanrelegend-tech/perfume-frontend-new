"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  // =========================================================
  // STEP 1 — SEND RESET CODE
  // =========================================================

  const handleSendCode = async (e) => {
    e.preventDefault();

    clearMessages();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/users/forgot-password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      // =====================================================
      // RATE LIMIT
      // =====================================================

      if (response.status === 429) {
        setError(
          "Too many attempts. Please wait a few minutes and try again."
        );
        return;
      }

      if (!response.ok) {
        const backendError =
          data.detail ||
          data.error ||
          data.message ||
          data.email?.[0];

        throw new Error(
          backendError ||
            "Unable to process your request. Please try again."
        );
      }

      setEmail(cleanEmail);
      setStep(2);

      setMessage(
        "If an account exists with this email, a reset code has been sent."
      );
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // STEP 2 — VERIFY CODE
  // =========================================================

  const handleCodeContinue = (e) => {
    e.preventDefault();

    clearMessages();

    const cleanCode = code.trim();

    if (!cleanCode) {
      setError("Please enter the reset code.");
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setError("Please enter the 6-digit reset code.");
      return;
    }

    setCode(cleanCode);
    setStep(3);
  };

  // =========================================================
  // STEP 3 — RESET PASSWORD
  // =========================================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "Your new password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/users/reset-password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: code.trim(),
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      // =====================================================
      // RATE LIMIT
      // =====================================================

      if (response.status === 429) {
        setError(
          "Too many attempts. Please wait a few minutes and try again."
        );
        return;
      }

      if (!response.ok) {
        const backendError =
          data.detail ||
          data.error ||
          data.message ||
          data.code?.[0] ||
          data.new_password?.[0];

        throw new Error(
          backendError ||
            "Unable to reset your password."
        );
      }

      setMessage(
        "Your password has been reset successfully."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RESEND CODE
  // =========================================================

  const handleResendCode = async () => {
    clearMessages();

    if (!email.trim()) {
      setError("Please enter your email address first.");
      setStep(1);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/users/forgot-password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      // =====================================================
      // RATE LIMIT
      // =====================================================

      if (response.status === 429) {
        setError(
          "Too many attempts. Please wait a few minutes before requesting another code."
        );
        return;
      }

      if (!response.ok) {
        const backendError =
          data.detail ||
          data.error ||
          data.message;

        throw new Error(
          backendError ||
            "Unable to resend the reset code."
        );
      }

      setMessage(
        "If an account exists with this email, a new reset code has been sent."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to resend the code."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // BACK
  // =========================================================

  const handleBack = () => {
    clearMessages();

    if (step === 2) {
      setStep(1);
      setCode("");
      return;
    }

    if (step === 3) {
      setStep(2);
      return;
    }
  };

  // =========================================================
  // PASSWORD STRENGTH
  // =========================================================

  const passwordLength = newPassword.length;

  const passwordStrength =
    passwordLength === 0
      ? ""
      : passwordLength < 8
      ? "Weak"
      : passwordLength < 12
      ? "Good"
      : "Strong";

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-black">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-center px-6">
          <Link
            href="/"
            className="text-[19px] font-semibold tracking-[0.32em] transition-opacity hover:opacity-60"
          >
            ORENTEMIST
          </Link>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12">

        <div className="w-full max-w-[500px]">

          {/* =================================================
              CARD
          ================================================= */}

          <div className="overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.07)]">

            {/* TOP DECORATION */}

            <div className="h-1 bg-black" />

            <div className="p-7 sm:p-10">

              {/* =================================================
                  BRAND / ICON
              ================================================= */}

              <div className="mb-8 text-center">

                <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.35em] text-black/35">
                  ORENTEMIST
                </p>

                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-black text-white shadow-lg">

                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="10"
                      rx="2"
                    />

                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />

                    <circle
                      cx="12"
                      cy="16"
                      r="1"
                    />
                  </svg>

                </div>

                {/* =================================================
                    STEP HEADINGS
                ================================================= */}

                {step === 1 && (
                  <>
                    <h1 className="text-[30px] font-semibold tracking-tight sm:text-[34px]">
                      Forgot your password?
                    </h1>

                    <p className="mx-auto mt-3 max-w-[390px] text-sm leading-6 text-black/50">
                      No worries. Enter your email and
                      we&apos;ll send you a secure code to
                      help you return to your ORENTEMIST
                      account.
                    </p>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h1 className="text-[30px] font-semibold tracking-tight sm:text-[34px]">
                      Check your email.
                    </h1>

                    <p className="mx-auto mt-3 max-w-[390px] text-sm leading-6 text-black/50">
                      We sent a 6-digit security code to
                    </p>

                    <p className="mt-2 break-all text-sm font-semibold text-black">
                      {email}
                    </p>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h1 className="text-[30px] font-semibold tracking-tight sm:text-[34px]">
                      Create a new password.
                    </h1>

                    <p className="mx-auto mt-3 max-w-[390px] text-sm leading-6 text-black/50">
                      Choose a new password and continue
                      your fragrance journey with ORENTEMIST.
                    </p>
                  </>
                )}

              </div>

              {/* =================================================
                  PROGRESS
              ================================================= */}

              <div className="mb-8">

                <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">
                  <span>Step {step} of 3</span>

                  <span>
                    {step === 1
                      ? "Email"
                      : step === 2
                      ? "Verification"
                      : "New password"}
                  </span>
                </div>

                <div className="flex gap-2">

                  {[1, 2, 3].map((number) => (
                    <div
                      key={number}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        number <= step
                          ? "bg-black"
                          : "bg-black/10"
                      }`}
                    />
                  ))}

                </div>

              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">

                  <div className="flex gap-3">

                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="M12 8v5" />
                        <path d="M12 16h.01" />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        Something went wrong
                      </p>

                      <p className="mt-1 text-xs leading-5 text-red-700">
                        {error}
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  SUCCESS
              ================================================= */}

              {message && (
                <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-4">

                  <div className="flex gap-3">

                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Request successful
                      </p>

                      <p className="mt-1 text-xs leading-5 text-green-700">
                        {message}
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  STEP 1 — EMAIL
              ================================================= */}

              {step === 1 && (
                <form
                  onSubmit={handleSendCode}
                  className="space-y-5"
                >

                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/55"
                    >
                      Email address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="h-14 w-full rounded-2xl border border-black/15 bg-white px-4 text-sm outline-none transition focus:border-black focus:ring-4 focus:ring-black/5"
                      required
                    />

                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 w-full items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending code...
                      </span>
                    ) : (
                      "Send reset code"
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-black/35">
                    For your security, we&apos;ll never
                    reveal whether an account exists for
                    an email address.
                  </p>

                </form>
              )}

              {/* =================================================
                  STEP 2 — CODE
              ================================================= */}

              {step === 2 && (
                <form
                  onSubmit={handleCodeContinue}
                  className="space-y-5"
                >

                  <div>

                    <label
                      htmlFor="code"
                      className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/55"
                    >
                      Security code
                    </label>

                    <input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => {
                        const value =
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6);

                        setCode(value);
                      }}
                      placeholder="000000"
                      className="h-16 w-full rounded-2xl border border-black/15 bg-white px-4 text-center text-2xl font-semibold tracking-[0.45em] outline-none transition placeholder:text-black/15 focus:border-black focus:ring-4 focus:ring-black/5"
                      required
                    />

                  </div>

                  <button
                    type="submit"
                    className="flex h-14 w-full items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-black/85"
                  >
                    Continue
                  </button>

                  <div className="flex items-center justify-between pt-1">

                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-sm font-medium text-black/45 transition hover:text-black"
                    >
                      ← Change email
                    </button>

                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={loading}
                      className="text-sm font-semibold underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {loading
                        ? "Sending..."
                        : "Resend code"}
                    </button>

                  </div>

                  <div className="rounded-2xl bg-[#f7f6f3] px-4 py-3 text-center">

                    <p className="text-xs leading-5 text-black/45">
                      Didn&apos;t receive it? Check your
                      spam or junk folder before requesting
                      another code.
                    </p>

                  </div>

                </form>
              )}

              {/* =================================================
                  STEP 3 — NEW PASSWORD
              ================================================= */}

              {step === 3 && (
                <form
                  onSubmit={handleResetPassword}
                  className="space-y-5"
                >

                  {/* NEW PASSWORD */}

                  <div>

                    <label
                      htmlFor="new-password"
                      className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/55"
                    >
                      New password
                    </label>

                    <div className="relative">

                      <input
                        id="new-password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(
                            e.target.value
                          )
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        className="h-14 w-full rounded-2xl border border-black/15 bg-white px-4 pr-16 text-sm outline-none transition focus:border-black focus:ring-4 focus:ring-black/5"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-black/45 hover:text-black"
                      >
                        {showPassword
                          ? "Hide"
                          : "Show"}
                      </button>

                    </div>

                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>

                    <label
                      htmlFor="confirm-password"
                      className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/55"
                    >
                      Confirm password
                    </label>

                    <div className="relative">

                      <input
                        id="confirm-password"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(
                            e.target.value
                          )
                        }
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className="h-14 w-full rounded-2xl border border-black/15 bg-white px-4 pr-16 text-sm outline-none transition focus:border-black focus:ring-4 focus:ring-black/5"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-black/45 hover:text-black"
                      >
                        {showConfirmPassword
                          ? "Hide"
                          : "Show"}
                      </button>

                    </div>

                  </div>

                  {/* PASSWORD STRENGTH */}

                  {newPassword && (
                    <div className="rounded-2xl bg-[#f7f6f3] px-4 py-3">

                      <div className="flex items-center justify-between">

                        <span className="text-xs font-medium text-black/45">
                          Password strength
                        </span>

                        <span className="text-xs font-semibold text-black">
                          {passwordStrength}
                        </span>

                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10">

                        <div
                          className={`h-full rounded-full transition-all ${
                            passwordLength < 8
                              ? "w-1/3"
                              : passwordLength < 12
                              ? "w-2/3"
                              : "w-full"
                          }`}
                          style={{
                            backgroundColor:
                              passwordLength < 8
                                ? "#ef4444"
                                : passwordLength < 12
                                ? "#eab308"
                                : "#22c55e",
                          }}
                        />

                      </div>

                    </div>
                  )}

                  {/* REQUIREMENTS */}

                  <div className="rounded-2xl border border-black/8 bg-[#faf9f6] px-4 py-3">

                    <p className="mb-2 text-xs font-semibold text-black/65">
                      Password requirements
                    </p>

                    <p className="text-xs leading-5 text-black/45">
                      At least 8 characters. Use a mixture
                      of letters, numbers and symbols for a
                      stronger password.
                    </p>

                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 w-full items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Resetting password...
                      </span>
                    ) : (
                      "Reset password"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full text-center text-sm font-medium text-black/45 transition hover:text-black"
                  >
                    ← Back to verification code
                  </button>

                </form>
              )}

              {/* =================================================
                  LOGIN
              ================================================= */}

              <div className="mt-8 border-t border-black/10 pt-6 text-center">

                <p className="text-sm text-black/45">

                  Remember your password?{" "}

                  <Link
                    href="/login"
                    className="font-semibold text-black underline underline-offset-4 transition-opacity hover:opacity-60"
                  >
                    Log in
                  </Link>

                </p>

              </div>

            </div>
          </div>

          {/* =================================================
              BOTTOM BRAND
          ================================================= */}

          <div className="mt-7 text-center">

            <p className="text-[10px] uppercase tracking-[0.28em] text-black/30">
              The Art of Fragrance
            </p>

            <p className="mt-2 text-[10px] text-black/25">
              Secure account recovery
            </p>

          </div>

        </div>
      </section>
    </main>
  );
}