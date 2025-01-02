import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    projects: {
      projectList: {
        items: {
          _title: true,
          cover: IMAGE_FRAGMENT,
          project: {
            client: {
              _title: true
            },
            categories: {
              _title: true
            }
          }
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
