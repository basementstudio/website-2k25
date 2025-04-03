import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const RUN_SENTRY = process.env.RUN_SENTRY === "true"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    turbo: {
      rules: {
        "*.{glsl,vert,frag,vs,fs}": {
          loaders: ["raw-loader", "glslify-loader"],
          as: "*.js"
        }
      }
    },
    ppr: "incremental"
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.basehub.com",
        pathname: "**"
      },
      {
        protocol: "https",
        hostname: "basehub.earth",
        pathname: "**"
      },
      {
        protocol: "https",
        hostname: "basement.studio",
        pathname: "**"
      },
      { protocol: "https", hostname: "pbs.twimg.com", pathname: "**" },
      { protocol: "https", hostname: "abs.twimg.com", pathname: "**" }
    ]
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"]
    })

    return config
  },

  async redirects() {
    return [
      {
        source: "/about",
        destination: "/services",
        permanent: true
      },
      {
        source: "/careers",
        destination: "/people",
        permanent: true
      },
      {
        source: "/showcase/apollographql",
        destination: "/showcase/apollo-a-brand-built-for-liftoff",
        permanent: true
      },
      {
        source: "/showcase/daylight",
        destination: "/showcase/daylight-simplicity-in-motion",
        permanent: true
      },
      {
        source: "/showcase/vercel",
        destination: "/showcase/vercel-a-partnership-that-keeps-scaling",
        permanent: true
      },
      {
        source: "/showcase/next-js",
        destination: "/showcase/nextjs-conf-raising-the-bar-again",
        permanent: true
      },
      {
        source: "/showcase/ranboo-fashion",
        destination: "/showcase/ranboo-one-merch-drop-at-a-time",
        permanent: true
      },
      {
        source: "/showcase/mrbeast",
        destination: "/showcase/mrbeast-built-to-handle-the-beast",
        permanent: true
      },
      {
        source: "/showcase/basement-chronicles",
        destination:
          "/showcase/showcase/basement-chronicles-the-internet-needs-you",
        permanent: true
      }

      // Todo: make proper redirects for blog posts
    ]
  }
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "basementstudio-be",
  project: "website-2k25",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
  sourcemaps: {
    disable: !RUN_SENTRY
  },
  telemetry: RUN_SENTRY
})
