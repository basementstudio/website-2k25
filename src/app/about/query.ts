import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    about: {
      intro: {
        json: { content: true }
      },
      imageSequence: {
        items: {
          image: IMAGE_FRAGMENT
        }
      }
    }
  },
  company: {
    services: {
      serviceList: {
        items: {
          _title: true,
          category: {
            _title: true
          }
        }
      }
    },
    clients: {
      clientList: {
        items: {
          _title: true,
          website: true
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
          role: true
        }
      }
    },
    awards: {
      awardList: {
        items: {
          _id: true,
          title: true,
          date: true,
          awardUrl: true,
          project: {
            _title: true
          }
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
