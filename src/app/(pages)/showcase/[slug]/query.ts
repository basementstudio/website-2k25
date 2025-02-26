import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export const projectFragment = fragmentOn("ProjectList", {
  items: {
    _slug: true,
    _title: true,
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
      content: {
        json: {
          content: true
        }
      },
      caseStudy: true,
      people: {
        department: {
          _title: true
        },
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
})

export type QueryType = fragmentOn.infer<typeof projectFragment>
export type QueryItemType = QueryType["items"][number]
