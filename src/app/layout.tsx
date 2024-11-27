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

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body>
      <Scene />
      {children}
    </body>
  </html>
);

export default RootLayout;
