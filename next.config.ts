import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: false,
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"]
    }
  },

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
  suppressWarnings: true,

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

    // Filter warnings
    config.infrastructureLogging = {
      level: "error"
    }

    return config
  },

  async redirects() {
    return [
      {
        source: "/about",
        destination: "/services",
        permanent: true
      }
    ]
  }
}

export default nextConfig
