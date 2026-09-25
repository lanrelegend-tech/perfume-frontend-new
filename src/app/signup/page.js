"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password2: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }

    if (name === "password") {
      setPasswordErrors([]);
    }
  };

  const getErrorMessage = (data) => {
    if (!data) {
      return "Unable to create your account.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return String(data.detail);
    }

    if (data.message) {
      return String(data.message);
    }

    if (data.error) {
      if (typeof data.error === "string") {
        return data.error;
      }

      if (typeof data.error === "object") {
        return Object.entries(data.error)
          .map(([field, message]) => {
            const value = Array.isArray(message)
              ? message.join(", ")
              : typeof message === "object"
              ? JSON.stringify(message)
              : String(message);

            return `${field}: ${value}`;
          })
          .join(" | ");
      }
    }

    if (data.non_field_errors) {
      return Array.isArray(data.non_field_errors)
        ? data.non_field_errors.join(" ")
        : String(data.non_field_errors);
    }

    if (typeof data === "object") {
      const messages = Object.entries(data)
        .map(([field, message]) => {
          let value;

          if (Array.isArray(message)) {
            value = message.join(", ");
          } else if (
            typeof message === "object" &&
            message !== null
          ) {
            value = Object.values(message)
              .flat()
              .join(", ");
          } else {
            value = String(message);
          }

          return `${field}: ${value}`;
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(" | ");
      }
    }

    return "Unable to create your account.";
  };

  const createBaseUsername = (email) => {
    const base = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    return base || `user${Date.now()}`;
  };

  const registerUser = async (username) => {
    const response = await fetch(`${API_URL}/auth/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        password2: form.password2,
      }),
    });

    let data = null;
    let rawText = "";

    try {
      rawText = await response.text();
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    return {
      response,
      data,
      rawText,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setPasswordErrors([]);

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const email = form.email.trim().toLowerCase();

    if (
      !firstName ||
      !lastName ||
      !email ||
      !form.password ||
      !form.password2
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password.length < 8) {
      setPasswordErrors([
        "Password must be at least 8 characters.",
      ]);
      return;
    }

    if (form.password !== form.password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const baseUsername = createBaseUsername(email);

      let username = baseUsername;
      let result = null;

      result = await registerUser(username);

      if (
        !result.response.ok &&
        result.data?.username &&
        Array.isArray(result.data.username) &&
        result.data.username.some((message) =>
          String(message)
            .toLowerCase()
            .includes("already exists")
        )
      ) {
        let registered = false;

        for (let number = 2; number <= 20; number++) {
          username = `${baseUsername}${number}`;

          result = await registerUser(username);

          if (result.response.ok) {
            registered = true;
            break;
          }

          const usernameError =
            result.data?.username &&
            Array.isArray(result.data.username)
              ? result.data.username.join(" ")
              : "";

          if (
            !usernameError
              .toLowerCase()
              .includes("already exists")
          ) {
            break;
          }
        }

        if (!registered && !result.response.ok) {
          if (
            result.data?.password &&
            Array.isArray(result.data.password)
          ) {
            setPasswordErrors(
              result.data.password.map(String)
            );

            return;
          }

          throw new Error(
            getErrorMessage(result.data) ||
              result.rawText ||
              `Registration failed with status ${result.response.status}`
          );
        }
      }

      if (!result.response.ok) {
        console.error(
          "REGISTER STATUS:",
          result.response.status
        );

        console.error(
          "REGISTER RESPONSE:",
          result.data
        );

        console.error(
          "REGISTER RAW RESPONSE:",
          result.rawText
        );

        if (
          result.data?.password &&
          Array.isArray(result.data.password)
        ) {
          setPasswordErrors(
            result.data.password.map(String)
          );

          return;
        }

        if (
          result.data?.password2 &&
          Array.isArray(result.data.password2)
        ) {
          setError(
            result.data.password2
              .map(String)
              .join(" ")
          );

          return;
        }

        if (
          result.data?.email &&
          Array.isArray(result.data.email)
        ) {
          setError(
            result.data.email
              .map(String)
              .join(" ")
          );

          return;
        }

        throw new Error(
          getErrorMessage(result.data) ||
            result.rawText ||
            `Registration failed with status ${result.response.status}`
        );
      }

      const data = result.data;

      const accessToken =
        data?.access ||
        data?.access_token ||
        data?.token ||
        data?.tokens?.access ||
        data?.tokens?.access_token;

      const refreshToken =
        data?.refresh ||
        data?.refresh_token ||
        data?.tokens?.refresh ||
        data?.tokens?.refresh_token;

      if (accessToken) {
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

        setSuccess(
          "Account created successfully. Redirecting..."
        );

        setTimeout(() => {
          router.push("/account");
        }, 500);

        return;
      }

      if (
        data?.verification_required ||
        data?.email_verification_required ||
        data?.requires_verification ||
        data?.email_verified === false
      ) {
        setSuccess(
          data?.message ||
            "Account created. Please verify your email to continue."
        );

        setTimeout(() => {
          router.push(
            `/account-verification?email=${encodeURIComponent(email)}`
          );
        }, 700);

        return;
      }

      setSuccess(
        "Account created successfully. Please sign in."
      );

      setTimeout(() => {
        router.push("/login");
      }, 700);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
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
                Become a member
              </p>

              <h1 className="text-5xl xl:text-6xl font-light leading-tight tracking-tight">
                Your signature
                <br />
                scent starts here.
              </h1>

              <p className="mt-8 text-white/60 max-w-md leading-7">
                Create your ORENTEMIST account and keep your
                orders, profile, wishlist and shopping
                experience in one place.
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

            {/* CLEAR PAGE HEADING */}
            <div className="mb-8 sm:mb-10">

              <p className="text-[11px] uppercase tracking-[0.25em] text-black/40 mb-3">
                ORENTEMIST ACCOUNT
              </p>

              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Create your account
              </h2>

              <p className="mt-3 text-sm sm:text-base leading-6 text-black/50">
                Enter your details below to create your
                ORENTEMIST account.
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

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* NAME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <div>
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-semibold text-black mb-2"
                  >
                    First name
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    autoComplete="given-name"
                    value={form.first_name}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="First name"
                    className="w-full h-12 border border-black/20 rounded-xl bg-white px-4 text-base sm:text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-semibold text-black mb-2"
                  >
                    Last name
                  </label>

                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    autoComplete="family-name"
                    value={form.last_name}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Last name"
                    className="w-full h-12 border border-black/20 rounded-xl bg-white px-4 text-base sm:text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50"
                  />
                </div>

              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="you@example.com"
                  className="w-full h-12 border border-black/20 rounded-xl bg-white px-4 text-base sm:text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Create a strong password"
                    className={`w-full h-12 rounded-xl bg-white border px-4 pr-16 text-base sm:text-sm outline-none transition placeholder:text-black/30 disabled:opacity-50 ${
                      passwordErrors.length > 0
                        ? "border-red-400 focus:border-red-500"
                        : "border-black/20 focus:border-black focus:ring-1 focus:ring-black"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wider text-black/40 hover:text-black"
                  >
                    {showPassword
                      ? "HIDE"
                      : "SHOW"}
                  </button>

                </div>

                {/* PASSWORD ERRORS */}
                {passwordErrors.length > 0 && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-semibold text-red-800 mb-2">
                      Please choose a stronger password:
                    </p>

                    <ul className="space-y-1.5">
                      {passwordErrors.map(
                        (message, index) => (
                          <li
                            key={`${message}-${index}`}
                            className="flex items-start gap-2 text-xs leading-5 text-red-700"
                          >
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />

                            <span>
                              {message}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {passwordErrors.length === 0 && (
                  <p className="mt-2 text-xs leading-5 text-black/40">
                    Use at least 8 characters with letters,
                    numbers and symbols.
                  </p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="password2"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Confirm password
                </label>

                <div className="relative">

                  <input
                    id="password2"
                    name="password2"
                    type={
                      showPassword2
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={form.password2}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Enter your password again"
                    className="w-full h-12 rounded-xl bg-white border border-black/20 px-4 pr-16 text-base sm:text-sm outline-none transition placeholder:text-black/30 focus:border-black focus:ring-1 focus:ring-black disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword2(
                        (prev) => !prev
                      )
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wider text-black/40 hover:text-black"
                  >
                    {showPassword2
                      ? "HIDE"
                      : "SHOW"}
                  </button>

                </div>
              </div>

              {/* TERMS */}
              <p className="text-xs leading-5 text-black/40">
                By creating an account, you agree to our
                terms and acknowledge our privacy policy.
              </p>

              {/* CREATE ACCOUNT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-black text-white text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-black/85 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </button>

            </form>

            {/* LOGIN */}
            <div className="mt-8 text-center">
              <p className="text-sm text-black/50">
                Already have an account?{" "}

                <Link
                  href="/login"
                  className="font-medium text-black underline underline-offset-4 hover:no-underline"
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* BACK HOME */}
            <div className="mt-6 pb-4 text-center">
              <Link
                href="/"
                className="text-xs uppercase tracking-[0.2em] text-black/40 hover:text-black transition"
              >
                ← Back to store
              </Link>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}