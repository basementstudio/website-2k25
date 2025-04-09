import type { Metadata } from "next"

import Basketball from "./client"

export const metadata: Metadata = {
  title: "Basketball",
  alternates: {
    canonical: "https://basement.studio/basketball"
  }
}

export default function Page() {
  return <Basketball />
}
