import { InfoItem } from "@/components/primitives/info-item"
import { TextList } from "@/components/primitives/text-list"

import type { ShowcaseProject } from "./sanity"

// Rendered by both the interactive grid and the prerendered fallback. It must
// be in the server HTML unconditionally (hidden on desktop via lg:hidden) —
// inserting it after hydration grew every card ~50px and registered as CLS.
export const MobileInfo = ({ project }: { project: ShowcaseProject }) => {
  return (
    <div className="col-span-full flex flex-col divide-y divide-brand-w1/20 lg:hidden">
      <InfoItem label="Client" value={project.client?.title} />
      <InfoItem
        label="Type"
        value={
          <TextList
            value={
              project.categories?.map((cat) => (
                <span key={cat.title}>{cat.title}</span>
              )) || []
            }
            className="text-f-p-mobile lg:text-f-p"
          />
        }
      />
      <div />
    </div>
  )
}
