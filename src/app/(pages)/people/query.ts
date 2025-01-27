import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const careersQuery = fragmentOn("Query", {
  pages: {
    people: {
      _title: true,
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
    },
    people: {
      peopleList: {
        items: {
          _title: true,
          department: {
            _title: true
          },
          role: true,
          image: IMAGE_FRAGMENT,
          socialNetworks: {
            __args: {
              // TODO: we should order by platform but there is a bug
              orderBy: "link__ASC"
            },
            items: {
              platform: true,
              link: true
            }
          }
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof careersQuery>
