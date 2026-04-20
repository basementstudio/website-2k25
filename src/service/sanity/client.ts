import { createClient } from "next-sanity"

import { apiVersion, dataset, projectId } from "../../../sanity/env"

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  stega: { studioUrl: "/studio" }
})
