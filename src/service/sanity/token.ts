export const token = process.env.SANITY_READ_TOKEN

// Shipped to the browser only during draft/preview sessions (see `<SanityLive
// includeDrafts>`), so it must be a Viewer-scoped token — never the read token.
export const browserToken = process.env.SANITY_BROWSER_TOKEN

if (process.env.NODE_ENV !== "production" && !token) {
  console.warn(
    "[sanity] Missing SANITY_READ_TOKEN — draft mode and live preview will not work."
  )
}

if (process.env.NODE_ENV !== "production" && !browserToken) {
  console.warn(
    "[sanity] Missing SANITY_BROWSER_TOKEN — browser-side live draft preview will not work."
  )
}
