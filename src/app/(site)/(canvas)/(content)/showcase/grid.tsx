import { memo } from "react"

import type { ImageFragment } from "@/components/primitives/image-with-video-overlay"
import { ImageWithVideoOverlay } from "@/components/primitives/image-with-video-overlay"
import { Link } from "@/components/primitives/link"
import { resolveVideoSource } from "@/lib/video/resolve-source"
import type { SanityImage } from "@/service/sanity/types"
import { cn } from "@/utils/cn"

import { MobileInfo } from "./mobile-info"
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

const GridCard = memo(
  ({ project, disabled }: { project: ShowcaseProject; disabled: boolean }) => {
    const image = toImageFragment(project.cover)
    return (
      <article
        className={cn(
          "contain-paint relative col-span-full flex flex-col gap-y-2 lg:col-span-3 lg:gap-y-0"
        )}
      >
        <div
          className={cn(
            "group relative aspect-video max-w-[100%] will-change-[opacity,transform] after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20 after:transition-colors after:duration-300 hover:will-change-auto lg:h-full",
            disabled && "after:border-brand-g1/20"
          )}
        >
          <Link
            disabled={disabled}
            href={`/showcase/${project.slug}`}
            className={cn(
              "with-dots block h-full w-full cursor-pointer opacity-100 transition-opacity duration-300 focus-visible:!ring-offset-0",
              disabled && "pointer-events-none cursor-default opacity-10"
            )}
            aria-label={`View ${project.title ?? "Untitled"}`}
          >
            {image ? (
              <ImageWithVideoOverlay
                image={image}
                video={resolveVideoSource({
                  mux: project.muxCoverVideo,
                  legacy: project.coverVideo
                })}
                variant="showcase"
              />
            ) : null}
          </Link>
        </div>

        <MobileInfo project={project} />
      </article>
    )
  }
)
GridCard.displayName = "GridCard"

interface GridProps {
  projects: ShowcaseProject[]
  disabledSlugs: Set<string> | null
}

export const Grid = memo(({ projects, disabledSlugs }: GridProps) => {
  return (
    <div className="grid-layout contain-layout !gap-y-8 lg:!gap-y-3">
      {projects.map((item, index) => (
        <GridCard
          key={item.title + index}
          project={item}
          disabled={disabledSlugs?.has(item.slug) ?? false}
        />
      ))}
    </div>
  )
})
Grid.displayName = "Grid"
