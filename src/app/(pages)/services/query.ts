import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/service/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    services: {
      intro: {
        json: { content: true }
      },
      heroImage: {
        url: true,
        width: true,
        height: true,
        alt: true
      },
      ventures: {
        title: true,
        content: {
          json: {
            content: true
          }
        },
        image: IMAGE_FRAGMENT
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
          certificate: IMAGE_FRAGMENT,
          projectFallback: true
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
