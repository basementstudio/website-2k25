import Image from "next/image"

import type { ShowcaseProject } from "../sanity"

/**
 * Server-rendered fallback for the interactive showcase list. The client list
 * bails out of prerendering (`useSearchParams`), which left the prerendered
 * /showcase HTML with zero project anchors — crawlers never saw the portfolio,
 * so most project pages had a single incoming internal link. This mirrors the
 * grid layout with plain links and covers; hydration swaps in the interactive
 * grid.
 */
export const ShowcaseListFallback = ({
  projects
}: {
  projects: ShowcaseProject[]
}) => (
  <div className="grid-layout !gap-y-8 lg:!gap-y-3">
    {projects.map((item) => {
      const asset = item.cover?.asset
      return (
        <article
          key={item._id}
          className="relative col-span-full flex flex-col gap-y-2 lg:col-span-3 lg:gap-y-0"
        >
          <div className="relative aspect-video max-w-[100%] after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
            <a
              href={`/showcase/${item.slug}`}
              className="block h-full w-full"
              aria-label={`View ${item.title ?? "Untitled"}`}
            >
              {asset ? (
                <Image
                  src={asset.url}
                  alt={item.cover?.alt ?? item.title ?? ""}
                  width={asset.metadata.dimensions.width}
                  height={asset.metadata.dimensions.height}
                  placeholder={asset.metadata.lqip ? "blur" : undefined}
                  blurDataURL={asset.metadata.lqip}
                  sizes="(max-width: 1024px) 100vw, 25vw"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </a>
          </div>
        </article>
      )
    })}
  </div>
)
