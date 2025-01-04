import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const careersQuery = fragmentOn("Query", {
  pages: {
    careers: {
      title: true,
      subheading1: true,
      subheading2: true
    }
  },
  company: {
    openPositions: {
      openPositionsList: {
        items: {
          _title: true,
          type: true,
          location: true,
          isOpen: true
        }
      }
    },
    ourValues: {
      valuesList: {
        items: {
          _title: true,
          description: true,
          image: IMAGE_FRAGMENT
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof careersQuery>
