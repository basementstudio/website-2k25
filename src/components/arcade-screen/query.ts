import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    laboratory: {
      projectList: {
        items: {
          _title: true,
          url: true,
          description: true,
          cover: IMAGE_FRAGMENT
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
