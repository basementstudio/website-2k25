import { defineLive } from "next-sanity/live"

import { client } from "./client"
import { browserToken, token } from "./token"

export const { sanityFetch: liveSanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken,
  // Wrapper always supplies perspective + stega and <SanityLive> supplies
  // includeDrafts, so strict catches any fetch that relies on defaults.
  strict: true
})
