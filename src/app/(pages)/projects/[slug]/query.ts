import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const projectFragment = fragmentOn("ProjectList", {
  items: {
    _slug: true,
    _title: true,
    cover: IMAGE_FRAGMENT,
    icon: IMAGE_FRAGMENT,
    showcase: {
      items: {
        image: IMAGE_FRAGMENT
      }
    },
    project: {
      _slug: true,
      client: {
        _title: true,
        website: true
      },
      year: true,
      categories: {
        _title: true
      },
      projectWebsite: true,
      description: {
        json: {
          content: true
        }
      },
      caseStudy: true
    }
  }
})

export type QueryType = fragmentOn.infer<typeof projectFragment>
export type QueryItemType = QueryType["items"][number]
