import type { Metadata } from "next"

import Basketball from "./client"

export const metadata: Metadata = {
  title: "basement Shot",
  alternates: {
    canonical: "https://basement.studio/basketball"
  }
}

export default function Page() {
  return <Basketball />
}
