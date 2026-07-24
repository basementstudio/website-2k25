import { defineLive } from "next-sanity/live"

import { client } from "./client"
import { browserToken, token } from "./token"

export const { sanityFetch: liveSanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken,
  // Every fetch goes through the `sanityFetch` wrapper (resolves perspective +
  // boolean stega) and the sole `<SanityLive>` passes `includeDrafts`, so strict
  // validation catches any future fetch that silently relies on defaults.
  strict: true
})
