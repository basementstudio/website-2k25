import Image from "next/image"

import { deriveCategories } from "../derive-categories"
import { MobileInfo } from "../mobile-info"
import type { ShowcaseProject } from "../sanity"

/**
 * Server-rendered fallback for the interactive showcase list. The client list
 * bails out of prerendering (`useSearchParams`), so this is the HTML crawlers
 * and first paint get; hydration swaps in the interactive tree. It must stay
 * structurally identical to `ShowcaseListClient` in its default state (grid
 * view, no category selected) — any node that only exists after hydration
 * (the filters bar, MobileInfo) previously pushed content down and registered
 * as CLS on mobile. Class names below are copied from ../filters.tsx and
 * ../grid.tsx; keep them in sync.
 */

/** Inert copy of ../filters.tsx in its default state (grid view active). */
const FiltersFallback = ({ projects }: { projects: ShowcaseProject[] }) => {
  const categories = deriveCategories(projects)

  return (
    <div className="grid-layout items-end pb-2">
      <div className="col-span-1 hidden items-center gap-1 text-f-p text-brand-g1 lg:flex">
        <span className="h-4 cursor-default text-brand-w1">
          <span className="!flex items-center justify-center gap-1 underline">
            <svg
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 12 12"
              className="size-3"
            >
              <path d="M2 2h5v5H2zM7 7h3v3H7z" />
            </svg>
            <span>Grid</span>
          </span>
        </span>
        <span className="text-brand-g1">,</span>
        <span className="h-4 cursor-pointer text-brand-g1">
          <span className="actionable actionable-no-underline !flex items-center justify-center gap-1">
            <svg
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 12 12"
              className="size-3"
            >
              <path d="M1 4h10v1H1zM1 7h10v1H1z" />
            </svg>
            <span>Rows</span>
          </span>
        </span>
      </div>

      <div className="col-span-3 flex flex-col gap-2 lg:col-start-7 lg:col-end-13">
        <p className="text-f-p-mobile text-brand-g1 lg:text-f-h3">Categories</p>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {categories.map((category) => (
            <button
              key={category.name}
              className="flex w-max items-center gap-x-1.25 text-left !text-f-h2-mobile text-brand-w1 transition-colors duration-300 lg:!text-f-h2"
            >
              <span className="actionable">{category.name}</span>
            </button>
          ))}
        </ul>
      </div>
    </div>
  )
}

export const ShowcaseListFallback = ({
  projects
}: {
  projects: ShowcaseProject[]
}) => (
  <section className="flex flex-col gap-2" id="list">
    <FiltersFallback projects={projects} />

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

            <MobileInfo project={item} />
          </article>
        )
      })}
    </div>
  </section>
)
