import { AssetsProvider } from "@/components/assets-provider";
import { fetchAssets } from "@/components/assets-provider/fetch-assets";
import { CameraRouteHandler } from "@/components/camera-route-handler";
import { Scene } from "@/components/scene";
import { Geist } from "next/font/google";
import "@/styles/globals.css";

import type { Metadata } from "next";
import { cn } from "@/utils/cn";

export const metadata: Metadata = {
  title: {
    template: "%s | basement.studio",
    default: "basement.studio | We make cool shit that performs.",
  },
  description:
    "basement is a boutique studio that brings what brands envision to life, through branding, visual design & development of the highest quality.",
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const assets = await fetchAssets();

  return (
    <html lang="en">
      <AssetsProvider assets={assets}>
        <body className={cn(geistSans.variable)}>
          <CameraRouteHandler />
          <Scene className="sticky top-0 h-screen w-full" />
          {children}
        </body>
      </AssetsProvider>
    </html>
  );
};

export default RootLayout;
