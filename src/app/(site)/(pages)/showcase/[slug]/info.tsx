import Image from "next/image"

import { ExternalLinkIcon } from "@/components/icons/icons"
import { Arrow } from "@/components/primitives/icons/arrow"
import { InfoItem } from "@/components/primitives/info-item"
import { Link } from "@/components/primitives/link"
import { PortableText } from "@/components/primitives/portable-text"
import { TextList } from "@/components/primitives/text-list"
import { getImageUrl } from "@/service/sanity/helpers"

import { Back } from "./back"
import { Filters } from "./gallery-filter"
import { RelatedProjects } from "./related"
import type { ShowcaseProjectDetail } from "./sanity"

interface ProjectInfoProps {
  entry: ShowcaseProjectDetail
}

export const ProjectInfo = ({ entry }: ProjectInfoProps) => {
  const website = entry.projectWebsite?.replace(/\/$/, "")
  const coverImg = getImageUrl(entry.cover)
  const iconImg = getImageUrl(entry.icon)

  return (
    <div className="col-span-full row-start-1 flex h-full flex-col gap-4 lg:col-span-3 lg:row-start-auto xl:col-span-2">
      <div className="mb-20 flex flex-col gap-4 lg:sticky lg:top-[calc(3.25rem+1px)] lg:mb-0 lg:h-[calc(100vh-4.25rem)]">
        <div className="flex items-center justify-between">
          <Back />

          <Filters />
        </div>

        <ul className="flex flex-col divide-y divide-brand-w1/20">
          <div />
          <InfoItem
            label="Client"
            value={
              <span className="flex min-w-0 items-center gap-0.75">
                {iconImg ? (
                  <span className="relative size-3.5 shrink-0 overflow-hidden rounded-full border border-brand-w1/20 bg-brand-g2">
                    <Image
                      src={iconImg.src}
                      fill
                      alt={
                        iconImg.alt ||
                        entry.client?.title ||
                        "Client logo"
                      }
                    />
                  </span>
                ) : null}
                <span className="truncate">
                  {entry.client?.title}
                </span>
              </span>
            }
          />
          <InfoItem label="Year" value={entry.year} />
          <InfoItem
            label="Type"
            value={
              <TextList
                className="flex-col"
                hasWrapper
                showComma={false}
                value={entry.categories?.map((c) => c.title) || []}
              />
            }
          />
          {(entry.awards?.length ?? 0) > 0 && (
            <InfoItem
              label="Awards"
              value={
                <TextList
                  className="flex-col"
                  hasWrapper
                  showComma={false}
                  value={entry.awards?.map((a) => a.title) || []}
                />
              }
            />
          )}
          {website && (
            <InfoItem
              label="Link"
              value={
                <Link
                  href={website}
                  target="_blank"
                  className="actionable flex items-center gap-1 text-brand-w1"
                >
                  {website.replace(/^https?:\/\//, "")}
                  <ExternalLinkIcon className="size-2" />
                </Link>
              }
            />
          )}

          <div />
        </ul>

        <div className="relative aspect-video w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20 lg:hidden">
          {coverImg ? (
            <Image
              src={coverImg.src}
              alt={coverImg.alt || ""}
              fill
              className="with-dots relative object-cover"
            />
          ) : null}
        </div>

        {entry.content ? (
          <div className="flex flex-col gap-2">
            <PortableText value={entry.content} />
          </div>
        ) : null}

        {entry.caseStudy ? (
          <Link
            href="#"
            className="inline-flex items-center gap-1 text-f-p-mobile text-brand-w1 lg:text-f-p"
          >
            <span className="actionable">
              View Case Study <Arrow className="size-4" />
            </span>
          </Link>
        ) : null}

        <RelatedProjects
          baseSlug={entry.slug || ""}
          className="mt-auto hidden lg:flex"
        />
      </div>
    </div>
  )
}
