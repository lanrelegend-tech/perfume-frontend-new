"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

function AccountVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = (searchParams.get("email") || "")
    .trim()
    .toLowerCase();

  const token = (searchParams.get("token") || "").trim();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [linkVerifying, setLinkVerifying] = useState(Boolean(token));

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((previous) =>
        previous > 0 ? previous - 1 : 0
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!token) {
      setLinkVerifying(false);
      return;
    }

    let cancelled = false;

    const verifySecureLink = async () => {
      setError("");
      setSuccess("");
      setLinkVerifying(true);

      try {
        const response = await fetch(
          `${API_URL}/users/verify-email-link/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          }
        );

        let data = null;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setError(
            data?.error ||
              data?.detail ||
              "This verification link is invalid or has expired."
          );
          return;
        }

        setSuccess(
          data?.message ||
            "Email verified successfully. You can now sign in."
        );

        setTimeout(() => {
          if (!cancelled) {
            router.push("/login");
          }
        }, 1500);
      } catch (err) {
        console.error(
          "VERIFY EMAIL LINK ERROR:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to verify your email. Please check your connection and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLinkVerifying(false);
        }
      }
    };

    verifySecureLink();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  const handleCodeChange = (e) => {
    const value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 6);

    setCode(value);
    setError("");
    setSuccess("");
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email) {
      setError(
        "No email address was provided. Please return to signup."
      );
      return;
    }

    if (code.length !== 6) {
      setError(
        "Please enter the 6-digit verification code."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/users/verify-email/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (data?.detail) {
          setError(String(data.detail));
        } else if (data?.error) {
          setError(
            typeof data.error === "string"
              ? data.error
              : JSON.stringify(data.error)
          );
        } else if (data?.non_field_errors) {
          setError(
            Array.isArray(data.non_field_errors)
              ? data.non_field_errors.join(" ")
              : String(data.non_field_errors)
          );
        } else {
          setError(
            "Verification failed. Please check your code and try again."
          );
        }

        return;
      }

      setSuccess(
        data?.message ||
          "Email verified successfully. Redirecting you to sign in..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error(
        "VERIFY EMAIL ERROR:",
        err
      );

      setError(
        "Unable to verify your email. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (
      !email ||
      resendCooldown > 0 ||
      resending
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setResending(true);

    try {
      const response = await fetch(
        `${API_URL}/users/resend-verification/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (data?.detail) {
          setError(String(data.detail));
        } else if (data?.error) {
          setError(
            typeof data.error === "string"
              ? data.error
              : JSON.stringify(data.error)
          );
        } else if (data?.non_field_errors) {
          setError(
            Array.isArray(data.non_field_errors)
              ? data.non_field_errors.join(" ")
              : String(data.non_field_errors)
          );
        } else {
          setError(
            "Unable to resend the verification email."
          );
        }

        return;
      }

      setCode("");

      setSuccess(
        data?.message ||
          "A new verification email has been sent to your inbox."
      );

      setResendCooldown(60);
    } catch (err) {
      console.error(
        "RESEND VERIFICATION ERROR:",
        err
      );

      setError(
        "Unable to resend the verification email. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="min-h-screen flex">

        {/* DESKTOP BRAND PANEL */}
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
                ACCOUNT SECURITY
              </p>

              <h1 className="text-5xl xl:text-6xl font-light leading-tight tracking-tight">
                Verify your
                <br />
                email address.
              </h1>

              <p className="mt-8 text-white/60 max-w-md leading-7">
                Confirm your email address to secure your
                ORENTEMIST account and continue shopping.
              </p>
            </div>

            <p className="text-xs text-white/40 tracking-wide">
              © {new Date().getFullYear()} ORENTEMIST
            </p>

          </div>
        </div>

        {/* FORM SIDE */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-8 sm:px-8 sm:py-12">
          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}
            <div className="lg:hidden mb-8 text-center">
              <Link
                href="/"
                className="text-xl sm:text-2xl tracking-[0.3em] font-medium"
              >
                ORENTEMIST
              </Link>
            </div>

            {/* LINK VERIFICATION */}
            {token && linkVerifying ? (
              <div className="text-center py-10">

                <p className="text-[11px] uppercase tracking-[0.25em] text-black/40 mb-3">
                  ACCOUNT VERIFICATION
                </p>

                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                  Verifying your email
                </h2>

                <p className="mt-4 text-sm sm:text-base leading-6 text-black/50">
                  Please wait while we securely verify your
                  email address.
                </p>

                <div className="mt-8 mx-auto h-8 w-8 rounded-full border-2 border-black/10 border-t-black animate-spin" />

              </div>
            ) : (
              <>

                {/* CLEAR HEADING */}
                <div className="mb-8 sm:mb-10">

                  <p className="text-[11px] uppercase tracking-[0.25em] text-black/40 mb-3">
                    EMAIL VERIFICATION
                  </p>

                  <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                    Verify your email
                  </h2>

                  <p className="mt-3 text-sm sm:text-base leading-6 text-black/50">
                    We need to confirm your email address
                    before you can sign in.
                  </p>

                </div>

                {/* EMAIL ADDRESS */}
                <div className="mb-7 rounded-xl border border-black/10 bg-black/[0.02] px-4 py-4">

                  <p className="text-[10px] uppercase tracking-[0.2em] text-black/40 mb-2">
                    Verification email
                  </p>

                  <p className="text-sm sm:text-base font-medium break-all">
                    {email || "Your email address"}
                  </p>

                </div>

                {/* ERROR */}
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {success && (
                  <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-sm leading-6 text-green-700">
                    {success}
                  </div>
                )}

                {/* CODE INSTRUCTIONS */}
                <div className="mb-6">

                  <h3 className="text-base sm:text-lg font-semibold">
                    Enter your verification code
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-black/50">
                    Open the verification email we sent you
                    and enter the 6-digit code below.
                  </p>

                </div>

                {/* CODE FORM */}
                <form
                  onSubmit={handleVerify}
                  className="space-y-6"
                >

                  <div>

                    <label
                      htmlFor="verification-code"
                      className="block text-sm font-semibold text-black mb-2"
                    >
                      6-digit verification code
                    </label>

                    <input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={handleCodeChange}
                      disabled={loading}
                      placeholder="000000"
                      className="w-full h-14 rounded-xl border border-black/20 bg-white px-4 text-center text-base sm:text-xl tracking-[0.4em] outline-none transition placeholder:text-black/20 focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50"
                    />

                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      code.length !== 6 ||
                      !email
                    }
                    className="w-full h-12 rounded-xl bg-black text-white text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-black/85 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Verifying..."
                      : "Verify email"}
                  </button>

                </form>

                {/* RESEND */}
                <div className="mt-8 border-t border-black/10 pt-7 text-center">

                  <p className="text-sm font-medium text-black">
                    Didn't receive the code?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-black/40">
                    Check your spam or junk folder first.
                  </p>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={
                      resending ||
                      resendCooldown > 0 ||
                      !email
                    }
                    className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {resending
                      ? "Sending..."
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend verification email"}
                  </button>

                </div>

                {/* LOGIN */}
                <div className="mt-8 text-center">

                  <p className="text-sm text-black/50">
                    Already verified?{" "}

                    <Link
                      href="/login"
                      className="font-medium text-black underline underline-offset-4 hover:no-underline"
                    >
                      Sign in
                    </Link>
                  </p>

                </div>

                {/* BACK */}
                <div className="mt-6 pb-4 text-center">

                  <Link
                    href="/"
                    className="text-xs uppercase tracking-[0.2em] text-black/40 hover:text-black transition"
                  >
                    ← Back to store
                  </Link>

                </div>

              </>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}

export default function AccountVerificationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-black flex items-center justify-center">
          <div className="text-xs uppercase tracking-[0.3em] text-black/40">
            Loading...
          </div>
        </main>
      }
    >
      <AccountVerificationContent />
    </Suspense>
  );
}