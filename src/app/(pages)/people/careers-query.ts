import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const careersQuery = fragmentOn("Query", {
  pages: {
    people: {
      title: true,
      subheading1: {
        json: {
          content: true
        }
      },
      subheading2: {
        json: {
          content: true
        }
      }
    }
  },
  company: {
    openPositions: {
      openPositionsList: {
        items: {
          _title: true,
          type: true,
          location: true,
          isOpen: true,
          applyUrl: true
        }
      }
    },
    ourValues: {
      valuesList: {
        items: {
          _title: true,
          description: {
            json: {
              content: true
            }
          },
          image: IMAGE_FRAGMENT
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof careersQuery>
