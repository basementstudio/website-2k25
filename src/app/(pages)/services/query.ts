import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    services: {
      intro: {
        json: { content: true }
      },
      imageSequence: {
        items: {
          image: IMAGE_FRAGMENT
        }
      },
      ventures: {
        title: true,
        content: {
          json: {
            content: true
          }
        }
      }
    }
  },
  company: {
    services: {
      serviceCategories: {
        items: {
          _title: true,
          description: {
            json: {
              content: true
            }
          }
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
          },
          certificate: IMAGE_FRAGMENT
        }
      }
    },
    testimonials: {
      services: {
        name: true,
        handle: true,
        handleLink: true,
        content: {
          json: {
            content: true
          }
        },
        avatar: IMAGE_FRAGMENT,
        date: true,
        role: {
          json: {
            content: true
          }
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
