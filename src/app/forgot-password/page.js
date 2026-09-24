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

      if (!response.ok) {
        const backendError =
          data.detail ||
          data.error ||
          data.message ||
          data.email?.[0];

        throw new Error(
          backendError || "Unable to process your request."
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

  return (
    <main className="min-h-screen bg-[#f7f6f3] text-black">
      {/* HEADER */}

      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-center px-6">
          <Link
            href="/"
            className="text-[20px] font-semibold tracking-[0.28em]"
          >
            ORENTEMIST
          </Link>
        </div>
      </header>

      {/* CONTENT */}

      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12">
        <div className="w-full max-w-[480px]">

          {/* CARD */}

          <div className="rounded-[28px] border border-black/10 bg-white p-7 shadow-[0_20px_70px_rgba(0,0,0,0.06)] sm:p-10">

            {/* TOP BRAND */}

            <div className="mb-9 text-center">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/40">
                ORENTEMIST
              </p>

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white">
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
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

              {step === 1 && (
                <>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Forgot your password?
                  </h1>

                  <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-black/50">
                    Enter your email address and we&apos;ll
                    send you a secure code to reset your
                    password.
                  </p>
                </>
              )}

              {step === 2 && (
                <>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Check your email.
                  </h1>

                  <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-black/50">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-black">
                      {email}
                    </span>
                  </p>
                </>
              )}

              {step === 3 && (
                <>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Create a new password.
                  </h1>

                  <p className="mx-auto mt-3 max-w-[380px] text-sm leading-6 text-black/50">
                    Choose a strong password for your
                    ORENTEMIST account.
                  </p>
                </>
              )}
            </div>

            {/* PROGRESS */}

            <div className="mb-8 flex items-center justify-center gap-2">
              {[1, 2, 3].map((number) => (
                <div
                  key={number}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    number === step
                      ? "w-10 bg-black"
                      : number < step
                      ? "w-6 bg-black/50"
                      : "w-6 bg-black/10"
                  }`}
                />
              ))}
            </div>

            {/* ERROR */}

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">
                {message}
              </div>
            )}

            {/* =================================================
                STEP 1
            ================================================= */}

            {step === 1 && (
              <form
                onSubmit={handleSendCode}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/60"
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
                    className="h-14 w-full rounded-2xl border border-black/15 bg-white px-4 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Sending code..."
                    : "Send reset code"}
                </button>
              </form>
            )}

            {/* =================================================
                STEP 2
            ================================================= */}

            {step === 2 && (
              <form
                onSubmit={handleCodeContinue}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/60"
                  >
                    Verification code
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
                    className="h-16 w-full rounded-2xl border border-black/15 bg-white px-4 text-center text-2xl font-semibold tracking-[0.45em] outline-none transition placeholder:text-black/20 focus:border-black"
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
                    className="text-sm font-medium text-black/50 transition hover:text-black"
                  >
                    ← Change email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm font-semibold underline underline-offset-4 disabled:opacity-40"
                  >
                    {loading
                      ? "Sending..."
                      : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {/* =================================================
                STEP 3
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
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/60"
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
                      className="h-14 w-full rounded-2xl border border-black/15 bg-white px-4 pr-16 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-black/50 hover:text-black"
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
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-black/60"
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
                      className="h-14 w-full rounded-2xl border border-black/15 bg-white px-4 pr-16 text-sm outline-none transition placeholder:text-black/30 focus:border-black"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-black/50 hover:text-black"
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
                    </button>
                  </div>
                </div>

                {/* PASSWORD REQUIREMENTS */}

                <div className="rounded-2xl bg-[#f7f6f3] px-4 py-3">
                  <p className="text-xs font-medium text-black/50">
                    Password must contain at least 8
                    characters.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Resetting password..."
                    : "Reset password"}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-center text-sm font-medium text-black/50 transition hover:text-black"
                >
                  ← Back to verification code
                </button>
              </form>
            )}

            {/* LOGIN */}

            <div className="mt-8 border-t border-black/10 pt-6 text-center">
              <p className="text-sm text-black/50">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-black underline underline-offset-4"
                >
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* BOTTOM BRAND TEXT */}

          <p className="mt-7 text-center text-[10px] uppercase tracking-[0.25em] text-black/30">
            The Art of Fragrance
          </p>
        </div>
      </section>
    </main>
  );
}