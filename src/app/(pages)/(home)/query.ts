import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    homepage: {
      intro: {
        title: {
          json: {
            content: true
          }
        },
        subtitle: {
          json: {
            content: true
          }
        }
      }
    }
  },
  company: {
    clients: {
      clientList: {
        items: {
          _id: true,
          logo: true,
          website: true
        }
      }
    },
    projects: {
      projectList: {
        __args: {
          filter: {
            featured: true
          }
        },
        items: {
          _title: true,
          description: {
            json: {
              content: true
            }
          },
          categories: {
            _title: true
          },
          _slug: true,
          cover: IMAGE_FRAGMENT
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
