import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
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

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*"
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*"
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide"
      }
    ]
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

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
        source: "/work",
        destination: "/showcase",
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

export default nextConfig
