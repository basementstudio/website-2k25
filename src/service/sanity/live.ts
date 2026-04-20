import { defineLive } from "next-sanity/live"

import { client } from "./client"
import { token } from "./token"

export const { sanityFetch: liveSanityFetch, SanityLive } = defineLive({
  client,
  serverToken: token,
  browserToken: token
})
