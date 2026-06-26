import type { Metadata } from "next"

import Basketball from "./client"

export const metadata: Metadata = {
  title: "basement Shot",
  description:
    "Take a shot in basement Shot — basement.studio's 3D WebGL basketball mini-game.",
  alternates: {
    canonical: "https://basement.studio/basketball"
  }
}

export default function Page() {
  return <Basketball />
}
