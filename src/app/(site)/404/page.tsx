import type { Metadata } from "next"

import NotFound from "../not-found"

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false }
}

export default function Page() {
  return <NotFound />
}
