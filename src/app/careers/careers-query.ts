import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const careersQuery = fragmentOn("Query", {
  company: {
    ourValues: {
      valuesList: {
        items: {
          _title: true,
          text: true,
          image: IMAGE_FRAGMENT
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof careersQuery>
