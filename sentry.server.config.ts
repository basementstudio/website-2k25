// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

const RUN_SENTRY = process.env.RUN_SENTRY === "true"

Sentry.init({
  dsn: "https://15243be4e326fa49a8bdeb7fb73be5f0@o4509039968911360.ingest.us.sentry.io/4509039969894400",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  enabled: RUN_SENTRY
})
