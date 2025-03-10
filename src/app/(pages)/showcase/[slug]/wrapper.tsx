import { ProjectProvider } from "./context"
import { ProjectGallery } from "./gallery"
import { ProjectInfo } from "./info"
import { ProjectPeople } from "./people"
import { QueryItemType } from "./query"
import { RelatedProjects } from "./related"

export const ProjectWrapper = ({
  entry
}: {
  entry: QueryItemType & { awards: { title: string }[] }
}) => (
  <ProjectProvider>
    <div className="grid-layout min-h-screen pt-[calc(2.25rem+1px)]">
      <ProjectGallery entry={entry} />
      <ProjectInfo entry={entry} />
    </div>
    {entry.project?._slug && (
      <div className="my-6 flex flex-col gap-y-12">
        <RelatedProjects
          baseSlug={entry.project?._slug}
          className="px-4 lg:hidden"
        />
        <ProjectPeople entry={entry} />
      </div>
    )}
  </ProjectProvider>
)
