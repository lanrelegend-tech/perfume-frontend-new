import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Start modestly so we don't send unnecessary amounts of data.
  tracesSampleRate: 0.1,

  // Don't collect session replay for now.
  // We can enable it later if you actually need it.
  sendDefaultPii: false,
});