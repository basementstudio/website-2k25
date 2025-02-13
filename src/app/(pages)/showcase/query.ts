import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    projects: {
      projectList: {
        items: {
          _title: true,
          showcase: {
            items: {
              image: IMAGE_FRAGMENT
            }
          },
          project: {
            _slug: true,
            client: {
              _title: true
            },
            year: true,
            categories: {
              _title: true
            },
            cover: IMAGE_FRAGMENT,
            icon: IMAGE_FRAGMENT
          }
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
