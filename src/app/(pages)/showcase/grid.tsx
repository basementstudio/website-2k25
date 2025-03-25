import { memo } from "react"

import { ImageWithVideoOverlay } from "@/components/primitives/image-with-video-overlay"
import { InfoItem } from "@/components/primitives/info-item"
import { TextList } from "@/components/primitives/text-list"
import { useMedia } from "@/hooks/use-media"
import { VideoFragment } from "@/lib/basehub/fragments"
import { ImageFragment } from "@/lib/basehub/fragments"
import { cn } from "@/utils/cn"

import { Project } from "./basehub"
import { Link } from "@/components/primitives/link"

const MobileInfo = memo(({ project }: { project: Project }) => {
  return (
    <div className="col-span-full flex flex-col divide-y divide-brand-w1/20 lg:hidden">
      <InfoItem label="Client" value={project.client?._title} />
      <InfoItem
        label="Type"
        value={
          <TextList
            value={
              project.categories?.map((cat) => (
                <span key={cat._title}>{cat._title}</span>
              )) || []
            }
            className="text-f-p-mobile lg:text-f-p"
          />
        }
      />
      <div />
    </div>
  )
})
MobileInfo.displayName = "MobileInfo"

export const Grid = memo(
  ({
    projects,
    isProjectDisabled
  }: {
    projects: Project[]
    isProjectDisabled: (project: Project) => boolean
  }) => {
    const isMobile = useMedia("(max-width: 1024px)")

    return (
      <div className="grid-layout contain-layout !gap-y-8 lg:!gap-y-3">
        {projects.map((item, index) => {
          const firstItem = index === 0

          return (
            <article
              key={item._title + index}
              className={cn(
                "relative flex flex-col gap-y-2 lg:gap-y-0",
                firstItem
                  ? "col-span-full lg:col-span-6 lg:row-span-2 lg:h-full"
                  : "col-span-full lg:col-span-3",
                "contain-paint"
              )}
            >
              <div
                className={cn(
                  "group relative aspect-video max-w-[100%] after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:h-full",
                  "will-change-[opacity,transform] hover:will-change-auto"
                )}
              >
                <Link
                  href={`/showcase/${item?._slug}`}
                  className={cn(
                    "with-dots block h-full w-full cursor-pointer opacity-100 transition-opacity duration-300",
                    isProjectDisabled(item) &&
                      "pointer-events-none cursor-default opacity-10"
                  )}
                >
                  {item?.cover?.url ? (
                    <ImageWithVideoOverlay
                      image={item.cover as ImageFragment}
                      video={item.coverVideo as VideoFragment}
                      firstItem={firstItem}
                      variant="showcase"
                    />
                  ) : null}
                </Link>
              </div>

              {isMobile && <MobileInfo project={item} />}
            </article>
          )
        })}
      </div>
    )
  }
)
Grid.displayName = "Grid"
