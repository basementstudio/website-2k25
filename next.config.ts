import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"
import { sanity } from "next-sanity/live/cache-life"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  cacheComponents: true,
  // Sanity Live handles on-demand revalidation, so override the 15-min default.
  cacheLife: {
    default: sanity
  },
  turbopack: {
    rules: {
      "*.{glsl,vert,frag,vs,fs}": {
        loaders: ["raw-loader"],
        as: "*.js"
      }
    }
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    // Cap the largest generated variant at 2560px (default tops out at 3840):
    // full-bleed art on 4K/high-DPR screens was producing multi-MB candidates
    // that site audits flag, with no visible gain over 2560.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "basement.studio",
        pathname: "**"
      },
      { protocol: "https", hostname: "pbs.twimg.com", pathname: "**" },
      { protocol: "https", hostname: "abs.twimg.com", pathname: "**" },
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "**" }
    ]
  },

  async headers() {
    return [
      {
        // Filenames under /public/3d are content-hashed, so URLs are immutable.
        source: "/3d/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },

  async redirects() {
    return [
      // Old pages
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
        source: "/work",
        destination: "/showcase",
        permanent: true
      },

      // Old showcase pages
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
      },

      // Old blog posts
      {
        source: "/blog/building-a-unique-website-for-basement-grotesque",
        destination: "/post/building-a-unique-website-for-basement-grotesque",
        permanent: true
      },
      {
        source: "/blog/migrating-large-scale-websites-from-gatsby-to-next-js",
        destination:
          "/post/migrating-large-scale-websites-from-gatsby-to-nextjs",
        permanent: true
      },
      {
        source: "/blog/mastering-color-gradients",
        destination: "/post/mastering-color-gradients",
        permanent: true
      },
      {
        source: "/blog/gsap-next-js-setup-the-bsmnt-way",
        destination: "/post/gsap-and-nextjs-setup-the-bsmnt-way",
        permanent: true
      },
      {
        source:
          "/blog/the-making-of-adhesion-a-bsmnt-take-on-blackletter-typefaces",
        destination:
          "/post/the-making-of-adhesion-a-bsmnt-take-on-blackletter-typefaces",
        permanent: true
      },
      {
        source: "/blog/kidsuper-world-bringing-paints-to-life-with-r3f",
        destination: "/post/kidsuper-world-bringing-paints-to-life-with-r3f",
        permanent: true
      },
      {
        source: "/blog/navigating-the-future-within-the-next-js-app-router",
        destination: "/post/navigating-the-future-within-the-nextjs-app-router",
        permanent: true
      },
      {
        source:
          "/blog/shipping-ship-behind-the-particle-shader-effect-for-vercel-s-conf",
        destination:
          "/post/shipping-ship-behind-the-particle-shader-effect-for-vercels-conf",
        permanent: true
      },
      {
        source: "/blog/daylight-shadows",
        destination: "/post/creating-daylight-or-the-shadows",
        permanent: true
      },
      {
        source: "/blog/creating-daylight-the-devex",
        destination: "/post/creating-daylight-or-the-devex",
        permanent: true
      },

      // Renamed blog posts
      {
        source: "/post/from-experiment-to-framework-the-road-to-xmcp-08",
        destination: "/post/from-experiment-to-framework-the-road-to-xmcp-v1",
        permanent: true
      },

      // Webby
      {
        source: "/webby",
        destination: "/",
        permanent: true
      },
      {
        source: "/webby/es",
        destination: "/",
        permanent: true
      }
    ]
  }
}

// Not the token alone: a dev machine can have one in .env.sentry-build-plugin.
const canPublishSentryArtifacts =
  process.env.VERCEL === "1" && Boolean(process.env.SENTRY_AUTH_TOKEN)

// Disabling sourcemaps also silences the plugin's own missing-token warning.
// Production only: preview is expected to run without the token.
if (process.env.VERCEL_ENV === "production" && !canPublishSentryArtifacts) {
  console.warn(
    "[sentry] SENTRY_AUTH_TOKEN is not set — skipping sourcemap upload and release creation. Production stack traces will be minified."
  )
}

export default withSentryConfig(nextConfig, {
  org: "basement-studio",
  project: "website-2k25",
  silent: !process.env.VERCEL,
  widenClientFileUpload: true,
  // `productionBrowserSourceMaps` stays unset so the SDK enables maps and
  // deletes them after upload.
  sourcemaps: { disable: !canPublishSentryArtifacts },
  release: { create: canPublishSentryArtifacts }
})
