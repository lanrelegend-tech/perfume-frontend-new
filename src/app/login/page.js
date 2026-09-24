"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        /*
         * =====================================================
         * EMAIL NOT VERIFIED
         * =====================================================
         *
         * The backend only returns this after the email and
         * password have been successfully validated.
         *
         * We then request a fresh secure verification-link email.
         */

        if (data?.error === "email_not_verified") {
          try {
            const resendResponse = await fetch(
              `${API_URL}/auth/resend-verification/`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email: form.email.trim(),
                }),
              }
            );

            const resendData =
              await resendResponse.json().catch(() => ({}));

            if (!resendResponse.ok) {
              throw new Error(
                resendData?.error ||
                  "Unable to send the verification email."
              );
            }

            setSuccess(
              "Your email is not verified. We’ve sent a new verification email to your inbox. Please click “Verify My Email” in the email to continue."
            );
          } catch (resendError) {
            console.error(
              "Verification email error:",
              resendError
            );

            setError(
              "Your email is not verified, but we couldn't send a new verification email right now. Please try again later."
            );
          }

          return;
        }

        const message =
          data?.detail ||
          data?.message ||
          data?.error ||
          data?.non_field_errors?.[0] ||
          data?.email?.[0] ||
          data?.password?.[0] ||
          "Invalid email or password.";

        throw new Error(message);
      }

      const accessToken =
        data?.access ||
        data?.access_token ||
        data?.token;

      const refreshToken =
        data?.refresh ||
        data?.refresh_token;

      if (!accessToken) {
        throw new Error(
          "Login succeeded, but no access token was returned."
        );
      }

      // Save authentication tokens
      localStorage.setItem(
        "access_token",
        accessToken
      );

      if (refreshToken) {
        localStorage.setItem(
          "refresh_token",
          refreshToken
        );
      }

      /*
       * If the customer came from a protected action,
       * such as leaving a product review, return them
       * to that exact page after login.
       *
       * Example:
       * /login?next=/products/12#reviews
       */
      const next = searchParams.get("next");

      if (next && next.startsWith("/")) {
        router.push(next);
      } else {
        router.push("/account");
      }

      router.refresh();
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT VISUAL SECTION */}
        <div className="relative hidden overflow-hidden bg-black lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent_45%)]" />

          <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">

            {/* Logo */}
            <Link
              href="/"
              className="text-xl font-semibold tracking-[0.25em]"
            >
              ORENTEMIST
            </Link>

            {/* Main message */}
            <div className="max-w-md">
              <p className="mb-5 text-xs uppercase tracking-[0.35em] text-white/50">
                The art of fragrance
              </p>

              <h1 className="text-5xl font-light leading-[1.05] tracking-tight xl:text-6xl">
                Welcome
                <br />
                back.
              </h1>

              <p className="mt-6 max-w-sm text-sm leading-6 text-white/60">
                Sign in to access your orders, wishlist,
                profile, and your ORENTEMIST fragrance
                collection.
              </p>
            </div>

            {/* Footer */}
            <p className="text-xs text-white/35">
              © {new Date().getFullYear()} ORENTEMIST
            </p>
          </div>
        </div>

        {/* LOGIN SECTION */}
        <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}
            <div className="mb-12 lg:hidden">
              <Link
                href="/"
                className="text-lg font-semibold tracking-[0.25em]"
              >
                ORENTEMIST
              </Link>
            </div>

            {/* HEADER */}
            <div className="mb-9">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-neutral-400">
                My account
              </p>

              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Sign in
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Enter your details to access your account.
              </p>
            </div>

            {/* SUCCESS */}
            {success && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3.5 text-sm text-green-700">

                <svg
                  className="mt-0.5 shrink-0"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />

                  <path d="m8 12 2.5 2.5L16 9" />
                </svg>

                <span>{success}</span>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700">

                <svg
                  className="mt-0.5 shrink-0"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />

                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-neutral-500"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="text-xs font-medium uppercase tracking-wider text-neutral-500"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-neutral-500 transition hover:text-black"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 pr-12 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {/* PASSWORD TOGGLE */}
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-neutral-400 transition hover:text-black"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M3 3l18 18" />

                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />

                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5.9 9 8s-3.5 8-9 8a9.7 9.7 0 0 1-4.5-1.1" />

                        <path d="M6.6 6.6C4.2 8 3 10.5 3 12c0 1.1.8 2.7 2.2 4.2" />
                      </svg>
                    ) : (
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />

                        <circle
                          cx="12"
                          cy="12"
                          r="2.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* REGISTER */}
            <div className="mt-8 text-center">
              <p className="text-sm text-neutral-500">
                Don't have an account?{" "}

                <Link
                  href="/signup"
                  className="font-medium text-black underline underline-offset-4"
                >
                  Create account
                </Link>
              </p>
            </div>

            {/* SECURITY NOTE */}
            <div className="mt-10 flex items-center justify-center gap-2 text-xs text-neutral-400">

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="10"
                  rx="2"
                />

                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>

              <span>
                Your information is securely protected.
              </span>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}