"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

export default function AdminLogin() {
  const router = useRouter();

const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

  if (!email || !password) {
  setError("Please enter your email and password.");
  return;
}
    setLoading(true);

    try {
      const csrfResponse = await fetch(`${API_URL}/auth/csrf/`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const csrfData = await csrfResponse.json().catch(() => ({}));

      if (!csrfResponse.ok || !csrfData.csrfToken) {
        throw new Error("Unable to initialize secure login.");
      }

      const response = await fetch(
        `${API_URL}/auth/login/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfData.csrfToken,
          },
          body: JSON.stringify({
  email,
  password,
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            data.message ||
            "Invalid username or password."
        );
        return;
      }

      const userResponse = await fetch(`${API_URL}/users/me/`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const user = await userResponse.json().catch(() => ({}));

      if (!userResponse.ok || !user.is_staff) {
        await fetch(`${API_URL}/auth/logout/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfData.csrfToken,
          },
        });
        setError("This account does not have administrator access.");
        return;
      }

      router.push("/admin/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 text-white">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              ORENTEMIST 
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Sign in to access the admin dashboard.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
  <label className="mb-2 block text-sm font-medium text-white/80">
    Email
  </label>

  <input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter your email"
    autoComplete="email"
    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
  />
</div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base sm:text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
