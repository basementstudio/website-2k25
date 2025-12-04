import { basehub } from "basehub"
import { Pump } from "basehub/react-pump"
import { notFound } from "next/navigation"

import { projectFragment } from "./query"
import { ProjectWrapper } from "./wrapper"

interface ProjectPostProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-static"

export const generateMetadata = async ({ params }: ProjectPostProps) => {
  const { slug } = await params

  const data = await basehub().query({
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
          items: {
            _title: true
          }
        }
      }
    }
  })

  if (data.pages.showcase.projectList.items.length === 0) return null
  const project = data.pages.showcase.projectList.items[0]

  return {
    title: {
      absolute: `${project._title ?? "Untitled"} | Showcase`
    },
    alternates: {
      canonical: `https://basement.studio/showcase/${slug}`
    }
  }
}

const ProjectPost = async ({ params }: ProjectPostProps) => {
  const { slug } = await params

  try {
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

          const entry = data.pages.showcase.projectList.items.at(0)
          if (!entry) return notFound()

          const awards = data2.company.awards.awardList.items.filter(
            (award) => award.project?._id === entry.project?._id
          )

          const entryWithAwards = {
            ...entry,
            awards
          }

          return <ProjectWrapper entry={entryWithAwards} />
        }}
      </Pump>
    )
  } catch {
    return notFound()
  }
}

// generate static pages for all projects
export const generateStaticParams = async () => {
  const {
    pages: {
      showcase: {
        projectList: { items }
      }
    }
  } = await client().query({
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
