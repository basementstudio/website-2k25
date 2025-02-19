import { fragmentOn } from "basehub"

export const query = fragmentOn("Query", {
  pages: {
    projects: {
      projectList: {
        items: {
          _slug: true
        }
      }
    },
    blog: {
      posts: {
        items: {
          _slug: true
        }
      }
    }
  },
  company: {
    social: {
      github: true,
      instagram: true,
      twitter: true,
      newsletter: {
        json: {
          content: true
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
