import { basehub, fragmentOn } from "basehub"

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
      image: ImageFragment,
      video: VideoFragment
    },
    __args: {
      first: 6
    }
  }
})

export type Project = fragmentOn.infer<typeof ProjectFragment>

export const fetchProjects = async () => {
  const projects = await basehub().query({
    pages: {
      showcase: {
        projectList: {
          items: {
            project: {
              ...ProjectFragment
            }
          },
          _meta: {
            filteredCount: true
          }
        }
      }
    }
  })

  return {
    projects: projects.pages.showcase.projectList.items.map(
      (item) => item.project
    ) as Project[],
    total: projects.pages.showcase.projectList._meta.filteredCount
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
