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
  return (
    <>
      {/* NavbarContent only unmounts after hydration flips the scene to 404;
          this marker hides it from the static first paint (see globals.css). */}
      <div data-page-404 hidden />
      <NotFound />
    </>
  )
}
