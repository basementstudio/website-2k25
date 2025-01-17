import { ProjectProvider } from "./context"
import { ProjectGallery } from "./gallery"
import { ProjectInfo } from "./info"
import { ProjectPeople } from "./people"
import { QueryItemType } from "./query"

export function ProjectWrapper({ entry }: { entry: QueryItemType }) {
  return (
    <ProjectProvider>
      <div className="grid-layout min-h-screen">
        <ProjectGallery entry={entry} />
        <ProjectInfo entry={entry} />
        <ProjectPeople entry={entry} />
      </div>
    </ProjectProvider>
  )
}
