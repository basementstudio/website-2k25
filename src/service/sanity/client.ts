import { createClient } from "next-sanity"

import { dataset, projectId } from "../../../sanity/env"

const apiVersion = "2024-01-01"

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  stega: { studioUrl: "/studio" }
})
