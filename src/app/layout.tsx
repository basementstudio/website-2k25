import { AssetsProvider } from "@/components/assets-provider";
import { fetchAssets } from "@/components/assets-provider/fetch-assets";
import { CameraRouteHandler } from "@/components/camera-route-handler";
import { Scene } from "@/components/scene";
import "@/styles/globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | basement.studio",
    default: "basement.studio | We make cool shit that performs.",
  },
  description:
    "basement is a boutique studio that brings what brands envision to life, through branding, visual design & development of the highest quality.",
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const assets = await fetchAssets();

  return (
    <html lang="en">
      <AssetsProvider assets={assets}>
        <body>
          <CameraRouteHandler />
          <Scene />
          {children}
        </body>
      </AssetsProvider>
    </html>
  );
};

export default RootLayout;
