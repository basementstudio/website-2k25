import { fragmentOn } from "basehub"

export const query = fragmentOn("Query", {
  pages: {
    blog: {
      posts: {
        items: {
          _sys: {
            createdAt: true
          },
          _title: true,
          _slug: true,
          date: true,
          intro: {
            json: { content: true }
          }
        }
      },
      categories: {
        items: {
          _title: true
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
