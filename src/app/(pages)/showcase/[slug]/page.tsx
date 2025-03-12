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
        },
        {
          company: {
            awards: {
              awardList: {
                items: {
                  title: true,
                  project: { _id: true }
                }
              }
            }
          }
        }
      ]}
    >
      {async ([data, data2]) => {
        "use server"

        const entry = data.pages.showcase.projectList.items[0]

        // add awwards
        const awards = data2.company.awards.awardList.items.filter(
          (award) => award.project?._id === entry.project?._id
        )

        const entryWithAwards = {
          ...entry,
          awards
        }

        if (!entry) return notFound()

        return <ProjectWrapper entry={entryWithAwards} />
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
