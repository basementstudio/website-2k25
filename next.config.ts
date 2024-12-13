import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    //dynamicIO: true,
    turbo: {
      rules: {
        "*.{glsl,vert,frag,vs,fs}": {
          loaders: ["raw-loader", "glslify-loader"],
          as: "*.js",
        },
      },
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.basehub.com",
        pathname: "**",
      },
    ],
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;
  },
};

export default nextConfig;
