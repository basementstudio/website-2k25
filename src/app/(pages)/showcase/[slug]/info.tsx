import Image from "next/image"

import { ExternalLinkIcon } from "@/components/icons/icons"
import { Arrow } from "@/components/primitives/icons/arrow"
import { InfoItem } from "@/components/primitives/info-item"
import { Link } from "@/components/primitives/link"
import { RichText } from "@/components/primitives/rich-text"
import { TextList } from "@/components/primitives/text-list"

import { Filters } from "./gallery-filter"
import { QueryItemType } from "./query"
import { RelatedProjects } from "./related"

export const ProjectInfo = ({ entry }: { entry: QueryItemType }) => (
  <div className="col-span-2 flex h-full flex-col gap-4">
    <div className="sticky top-11 mb-48 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="actionable inline-flex items-center gap-1 text-p text-brand-w1"
        >
          <Arrow className="size-4 rotate-180" /> All Projects
        </Link>

        <Filters />
      </div>

      <ul className="flex flex-col divide-y divide-brand-w1/20">
        <div />
        <InfoItem
          label="Client"
          value={
            <span className="flex items-center gap-0.75">
              {entry.icon ? (
                <span className="relative size-3.5 overflow-hidden rounded-full border border-brand-w1/20 bg-brand-g2">
                  <Image
                    src={entry.icon?.url}
                    fill
                    alt={
                      entry.icon?.alt ||
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
              value={entry.project?.categories?.map((c) => c._title) || []}
            />
          }
        />
        <InfoItem
          label="Awards"
          value={
            <TextList
              value={["Awwwards", "CSS Design Awards"].map((a) => (
                <Link key={a} href={a} className="actionable text-brand-w1">
                  {a}
                </Link>
              ))}
            />
          }
        />
        <InfoItem
          label="Website"
          value={
            <Link
              key={entry.project?.client?.website}
              href={entry.project?.client?.website || ""}
              target="_blank"
              className="actionable inline-flex items-center gap-1 text-brand-w1"
            >
              {entry.project?.projectWebsite}{" "}
              <ExternalLinkIcon className="size-2" />
            </Link>
          }
        />
        <div />
      </ul>

      {entry.project?.description?.json?.content ? (
        <div className="flex flex-col gap-2">
          <RichText>{entry.project?.description?.json?.content}</RichText>
        </div>
      ) : null}

      <Link
        href={entry.project?.caseStudy || ""}
        className="actionable inline-flex items-center gap-1 text-p text-brand-w1"
        target="_blank"
      >
        View Case Study <Arrow className="size-4" />
      </Link>
    </div>

    <RelatedProjects baseSlug={entry.project?._slug || ""} />
  </div>
)
