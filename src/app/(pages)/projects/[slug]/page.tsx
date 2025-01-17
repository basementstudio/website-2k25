import { basehub } from "basehub"
import { Pump } from "basehub/react-pump"
import { notFound } from "next/navigation"

import { projectFragment } from "./query"
import { ProjectWrapper } from "./wrapper"

const ProjectPost = async ({
  params
}: {
  params: Promise<{ slug: string }>
}) => {
  const { slug } = await params

  return (
    <Pump
      queries={[
        {
          pages: {
            projects: {
              projectList: {
                __args: {
                  first: 1,
                  filter: {
                    project: {
                      _sys_slug: {
                        eq: slug
                      }
                    }
                  }
                },
                ...projectFragment
              }
            }
          }
        }
      ]}
    >
      {async ([data]) => {
        "use server"

        const entry = data.pages.projects.projectList.items[0]
        if (!entry) return notFound()

        return <ProjectWrapper entry={entry} />
      }}
    </Pump>
  )
}

// generate static pages for all projects
export const generateStaticParams = async () => {
  const {
    pages: {
      projects: {
        projectList: { items }
      }
    }
  } = await basehub({ cache: "no-store" }).query({
    pages: {
      projects: {
        projectList: {
          items: {
            project: {
              _slug: true
            }
          }
        }
      }
    }
  })

  return items.map((p) => {
    return { slug: p.project?._slug }
  })
}

export default ProjectPost
