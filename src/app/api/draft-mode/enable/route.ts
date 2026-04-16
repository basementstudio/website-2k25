import { defineEnableDraftMode } from "next-sanity/draft-mode"

import { client } from "@/service/sanity/client"
import { token } from "@/service/sanity/token"

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token })
})
