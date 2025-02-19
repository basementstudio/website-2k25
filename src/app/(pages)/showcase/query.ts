import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    showcase: {
      projectList: {
        items: {
          _title: true,
          project: {
            _title: true,
            _slug: true,
            client: {
              _title: true
            },
            year: true,
            categories: {
              _title: true
            },
            cover: IMAGE_FRAGMENT,
            icon: IMAGE_FRAGMENT,
            showcase: {
              items: {
                image: IMAGE_FRAGMENT
              }
            }
          }
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
