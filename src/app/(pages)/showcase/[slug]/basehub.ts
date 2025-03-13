import { fragmentOn } from "basehub"

import { client } from "@/service/basehub"

const ImageFragment = fragmentOn("BlockImage", {
  url: true,
  width: true,
  height: true,
  alt: true,
  blurDataURL: true
})

const VideoFragment = fragmentOn("BlockVideo", {
  url: true,
  width: true,
  height: true
})

const ProjectFragment = fragmentOn("ProjectComponent", {
  _title: true,
  _slug: true,
  client: {
    _title: true
  },
  year: true,
  categories: {
    _slug: true,
    _title: true
  },
  cover: ImageFragment,
  coverVideo: VideoFragment,
  icon: ImageFragment,
  showcase: {
    items: {
      image: ImageFragment
    },
    __args: {
      first: 6
    }
  }
})

export type Project = fragmentOn.infer<typeof ProjectFragment>

export const fetchProject = async (slug: string) => {
  const project = await client().query({
    company: {
      projects: {
        projectList: {
          item: {
            ...ProjectFragment
          },
          __args: {
            filter: {
              _sys_slug: { eq: slug }
            }
          }
        }
      },
      awards: {
        awardList: {
          items: {
            title: true,
            project: {
              _id: true
            }
          },
          __args: {
            filter: {
              project: {
                _slug: { eq: slug }
              }
            }
          }
        }
      }
    }
  })

  return {
    project: project.company.projects.projectList.item,
    awards: project.company.awards.awardList.items
  }
}

export const fetchCategories = async () => {
  const categories = await client().query({
    company: {
      projects: {
        projectCategories: {
          items: {
            _title: true,
            _slug: true
          }
        }
      }
    }
  })

  return categories.company.projects.projectCategories.items
}
