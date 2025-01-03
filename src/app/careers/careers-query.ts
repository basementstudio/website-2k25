import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const careersQuery = fragmentOn("Query", {
  pages: {
    careers: {
      _title: true,
      description: true,
      description_1: true,
    }
  },
  company: {
    ourValues: {
      valuesList: {
        items: {
          _title: true,
          text: true,
          image: IMAGE_FRAGMENT
        }
      }
    },
    openPositions: {
      openPositionsList:{
        items: {
          _title: true,
          text: true,
          text_1: true,
          boolean: true,
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof careersQuery>
