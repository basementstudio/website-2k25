import { basehub } from "basehub"
import { Pump } from "basehub/react-pump"
import { notFound } from "next/navigation"

import { projectFragment } from "./query"
import { ProjectWrapper } from "./wrapper"

interface ProjectPostProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-static"

const ProjectPost = async ({ params }: ProjectPostProps) => {
  const { slug } = await params

  return (
    <Pump
      queries={[
        {
          pages: {
            showcase: {
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

        const entry = data.pages.showcase.projectList.items[0]
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
      showcase: {
        projectList: { items }
      }
    }
  } = await basehub({ cache: "no-store" }).query({
    pages: {
      showcase: {
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

  return items.map((p) => ({ slug: p.project?._slug }))
}

export default ProjectPost
