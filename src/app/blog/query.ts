import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const query = fragmentOn("Query", {
  pages: {
    blog: {
      posts: {
        items: {
          _title: true,
          _slug: true,
          date: true,
          intro: {
            json: { content: true }
          }
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
