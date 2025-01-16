import { Pump } from "basehub/react-pump"
import { notFound } from "next/navigation"

import { ProjectGallery } from "./gallery"
import { ProjectInfo } from "./info"
import { projectFragment } from "./query"

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

        return (
          <div className="grid-layout min-h-screen">
            <ProjectGallery entry={entry} />
            <ProjectInfo entry={entry} />
          </div>
        )
      }}
    </Pump>
  )
}
export default ProjectPost
