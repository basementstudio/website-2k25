import Image from "next/image"

import { ExternalLinkIcon } from "@/components/icons/icons"
import { Arrow } from "@/components/primitives/icons/arrow"
import { InfoItem } from "@/components/primitives/info-item"
import { Link } from "@/components/primitives/link"
import { RichText } from "@/components/primitives/rich-text"
import { TextList } from "@/components/primitives/text-list"

import { Back } from "./back"
import { Filters } from "./gallery-filter"
import { QueryItemType } from "./query"
import { RelatedProjects } from "./related"

interface ProjectInfoProps {
  entry: QueryItemType & { awards: { title: string }[] }
}

export const ProjectInfo = ({ entry }: ProjectInfoProps) => {
  const website = entry.project?.projectWebsite?.replace(/\/$/, "")

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
              <span className="flex items-center gap-0.75">
                {entry.project?.icon ? (
                  <span className="relative size-3.5 overflow-hidden rounded-full border border-brand-w1/20 bg-brand-g2">
                    <Image
                      src={entry.project?.icon?.url}
                      fill
                      alt={
                        entry.project?.icon?.alt ||
                        entry.project?.client?._title ||
                        "Client logo"
                      }
                    />
                  </span>
                ) : null}
                {entry.project?.client?._title}
              </span>
            }
          />
          <InfoItem label="Year" value={entry.project?.year} />
          <InfoItem
            label="Type"
            value={
              <TextList
                className="flex-col"
                hasWrapper
                showComma={false}
                value={entry.project?.categories?.map((c) => c._title) || []}
              />
            }
          />
          {entry.awards.length > 0 && (
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
              label="Website"
              value={
                <Link
                  href={website}
                  target="_blank"
                  className="actionable line-clamp-1 flex items-center gap-1 text-brand-w1"
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
          <Image
            src={entry.project?.cover?.url || ""}
            alt={entry.project?.cover?.alt || ""}
            fill
            className="with-dots relative object-cover"
          />
        </div>

        {entry.project?.content?.json?.content ? (
          <div className="flex flex-col gap-2">
            <RichText>{entry.project?.content?.json?.content}</RichText>
          </div>
        ) : null}

        {entry.project?.caseStudy ? (
          <Link
            href={entry.project?.caseStudy || ""}
            className="inline-flex items-center gap-1 text-f-p-mobile text-brand-w1 lg:text-f-p"
          >
            <span className="actionable">
              View Case Study <Arrow className="size-4" />
            </span>
          </Link>
        ) : null}

        <RelatedProjects
          baseSlug={entry.project?._slug || ""}
          className="mt-auto hidden lg:flex"
        />
      </div>
    </div>
  )
}
