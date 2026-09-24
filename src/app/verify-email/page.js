"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");

    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [searchParams]);

  const handleCodeChange = (e) => {
    const value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setCode(value);
    setError("");
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/verify-email/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code,
          }),
        }
      );

      const rawText = await response.text();

      let data = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            "Verification failed. Please check your code and try again."
        );
      }

      setSuccess(
        data?.message ||
          "Email verified successfully."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error("Email verification error:", err);

      setError(
        err?.message ||
          "Unable to verify your email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setResending(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/resend-verification/`,
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

      const rawText = await response.text();

      let data = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            "Unable to resend the verification code."
        );
      }

      setSuccess(
        data?.message ||
          "A new verification code has been sent to your email."
      );
    } catch (err) {
      console.error("Resend verification error:", err);

      setError(
        err?.message ||
          "Unable to resend the verification code."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="min-h-screen flex">

        {/* LEFT SIDE */}
        <div className="hidden lg:flex lg:w-1/2 bg-black text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_35%)]" />

          <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">

            <div>
              <Link
                href="/"
                className="text-2xl tracking-[0.35em] font-medium"
              >
                ORENTEMIST
              </Link>
            </div>

            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50 mb-6">
                Email verification
              </p>

              <h1 className="text-5xl xl:text-6xl font-light leading-tight tracking-tight">
                One final
                <br />
                step.
              </h1>

              <p className="mt-8 text-white/60 max-w-md leading-7">
                Check your inbox for your six-digit verification
                code and confirm your email address to complete
                your ORENTEMIST account.
              </p>
            </div>

            <p className="text-xs text-white/40 tracking-wide">
              © {new Date().getFullYear()} ORENTEMIST
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}
            <div className="lg:hidden mb-12">
              <Link
                href="/"
                className="text-xl tracking-[0.3em] font-medium"
              >
                ORENTEMIST
              </Link>
            </div>

            <div className="mb-10">
              <p className="text-xs uppercase tracking-[0.3em] text-black/40 mb-4">
                Verify your email
              </p>

              <h2 className="text-3xl sm:text-4xl font-light tracking-tight">
                Check your inbox
              </h2>

              <p className="mt-3 text-sm text-black/50 leading-6">
                We sent a 6-digit verification code to your email
                address. Enter it below to activate your account.
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 leading-6">
                {error}
              </div>
            )}

            {/* SUCCESS */}
            {success && (
              <div className="mb-6 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 leading-6">
                {success}
              </div>
            )}

            <form
              onSubmit={handleVerify}
              className="space-y-6"
            >

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs uppercase tracking-[0.2em] text-black/50 mb-2"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  disabled={loading || resending}
                  placeholder="you@example.com"
                  className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-black disabled:opacity-50"
                />
              </div>

              {/* CODE */}
              <div>
                <label
                  htmlFor="code"
                  className="block text-xs uppercase tracking-[0.2em] text-black/50 mb-2"
                >
                  Verification code
                </label>

                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={handleCodeChange}
                  disabled={loading}
                  maxLength={6}
                  placeholder="000000"
                  className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-xl tracking-[0.5em] outline-none transition placeholder:text-black/20 focus:border-black disabled:opacity-50"
                />

                <p className="mt-3 text-xs text-black/40">
                  The code expires after 10 minutes.
                </p>
              </div>

              {/* VERIFY */}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-black text-white py-4 text-xs uppercase tracking-[0.25em] transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Verifying..."
                  : "Verify email"}
              </button>
            </form>

            {/* RESEND */}
            <div className="mt-8 text-center">
              <p className="text-sm text-black/50">
                Didn't receive the code?
              </p>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || loading}
                className="mt-2 text-xs uppercase tracking-[0.2em] text-black underline underline-offset-4 hover:no-underline disabled:opacity-40"
              >
                {resending
                  ? "Sending..."
                  : "Resend verification code"}
              </button>
            </div>

            {/* LOGIN */}
            <div className="mt-8 text-center">
              <Link
                href="/login"
                className="text-xs uppercase tracking-[0.2em] text-black/40 hover:text-black transition"
              >
                ← Back to sign in
              </Link>
            </div>

            {/* HOME */}
            <div className="mt-5 text-center">
              <Link
                href="/"
                className="text-xs uppercase tracking-[0.2em] text-black/40 hover:text-black transition"
              >
                Back to store
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}