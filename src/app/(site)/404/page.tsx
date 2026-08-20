import type { Metadata } from "next"

import NotFound from "../not-found"

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false }
}

// Vercel resolves the literal /404 URL to the deployment's error document
// before middleware or rewrites run, so only a real route at this path can
// serve the not-found experience the [...notFound] catch-all renders.
export default function Page() {
  return <NotFound />
}
