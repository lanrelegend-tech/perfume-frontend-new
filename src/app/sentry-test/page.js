"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const testClientError = () => {
    Sentry.captureException(
      new Error("ORENTEMIST Sentry client test error")
    );
  };

  const testThrownError = () => {
    throw new Error("ORENTEMIST Sentry thrown test error");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>ORENTEMIST Sentry Test</h1>

      <p>
        Temporary page for testing Sentry error monitoring.
      </p>

      <button
        onClick={testClientError}
        style={{
          padding: "12px 20px",
          cursor: "pointer",
        }}
      >
        Test Client Error
      </button>

      <button
        onClick={testThrownError}
        style={{
          padding: "12px 20px",
          cursor: "pointer",
        }}
      >
        Test Thrown Error
      </button>
    </main>
  );
}