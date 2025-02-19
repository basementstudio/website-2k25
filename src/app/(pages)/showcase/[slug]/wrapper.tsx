import { ProjectProvider } from "./context"
import { ProjectGallery } from "./gallery"
import { ProjectInfo } from "./info"
import { ProjectPeople } from "./people"
import { QueryItemType } from "./query"

export const ProjectWrapper = ({ entry }: { entry: QueryItemType }) => (
  <ProjectProvider>
    <div className="grid-layout min-h-screen pt-12">
      <ProjectGallery entry={entry} />
      <ProjectInfo entry={entry} />
    </div>
    <ProjectPeople entry={entry} />
  </ProjectProvider>
)
