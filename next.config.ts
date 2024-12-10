import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
    turbo: {
      rules: {
        "*.{glsl,vert,frag,vs,fs}": {
          loaders: ["raw-loader", "glslify-loader"],
          as: "*.js",
        },
      },
    },
  },
};

export default nextConfig;
