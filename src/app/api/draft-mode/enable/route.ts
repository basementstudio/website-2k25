import { defineEnableDraftMode } from "next-sanity/draft-mode"

import { client } from "@/service/sanity"

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_READ_TOKEN })
})
