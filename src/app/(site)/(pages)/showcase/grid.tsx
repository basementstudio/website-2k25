import { memo } from "react"

import { ImageWithVideoOverlay } from "@/components/primitives/image-with-video-overlay"
import { InfoItem } from "@/components/primitives/info-item"
import { Link } from "@/components/primitives/link"
import { TextList } from "@/components/primitives/text-list"
import { useMedia } from "@/hooks/use-media"
import type {
  ImageFragment,
  VideoFragment
} from "@/components/primitives/image-with-video-overlay"
import type { SanityImage, SanityVideo } from "@/service/sanity/types"
import { cn } from "@/utils/cn"

import type { ShowcaseProject } from "./sanity"

/** Convert a SanityImage to the ImageFragment shape used by ImageWithVideoOverlay. */
function toImageFragment(img: SanityImage | null): ImageFragment | null {
  if (!img?.asset) return null
  return {
    url: img.asset.url,
    alt: img.alt ?? "",
    width: img.asset.metadata.dimensions.width,
    height: img.asset.metadata.dimensions.height,
    blurDataURL: img.asset.metadata.lqip
  }
}

/** Convert a SanityVideo to the VideoFragment shape used by ImageWithVideoOverlay. */
function toVideoFragment(
  video: SanityVideo | null | undefined
): VideoFragment | null {
  if (!video?.url) return null
  return { url: video.url, mimeType: video.mimeType }
}

const MobileInfo = memo(({ project }: { project: ShowcaseProject }) => {
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
})
MobileInfo.displayName = "MobileInfo"

interface GridProps {
  projects: ShowcaseProject[]
  isProjectDisabled: (project: ShowcaseProject) => boolean
}

export const Grid = memo(({ projects, isProjectDisabled }: GridProps) => {
  const isMobile = useMedia("(max-width: 1024px)")

  return (
    <div className="grid-layout contain-layout !gap-y-8 lg:!gap-y-3">
      {projects.map((item, index) => {
        const image = toImageFragment(item.cover)
        return (
          <article
            key={item.title + index}
            className={cn(
              "contain-paint relative col-span-full flex flex-col gap-y-2 lg:col-span-3 lg:gap-y-0"
            )}
          >
            <div
              className={cn(
                "group relative aspect-video max-w-[100%] will-change-[opacity,transform] after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20 after:transition-colors after:duration-300 hover:will-change-auto lg:h-full",
                isProjectDisabled(item) && "after:border-brand-g1/20"
              )}
            >
              <Link
                disabled={isProjectDisabled(item)}
                href={`/showcase/${item.slug}`}
                className={cn(
                  "with-dots block h-full w-full cursor-pointer opacity-100 transition-opacity duration-300 focus-visible:!ring-offset-0",
                  isProjectDisabled(item) &&
                    "pointer-events-none cursor-default opacity-10"
                )}
                aria-label={`View ${item.title ?? "Untitled"}`}
              >
                {image ? (
                  <ImageWithVideoOverlay
                    image={image}
                    video={toVideoFragment(item.coverVideo)}
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
})
Grid.displayName = "Grid"
