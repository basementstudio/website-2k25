"use client"

import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"

import { Arrow } from "@/components/primitives/icons/arrow"

import { GalleryFilter } from "./gallery-filter"
import { QueryItemType } from "./query"

export function ProjectInfo({ entry }: { entry: QueryItemType }) {
  return (
    <div className="col-span-2 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="actionable inline-flex items-center gap-2 text-p text-brand-w1"
        >
          <Arrow className="size-5 rotate-180" /> All projects
        </Link>

        <div className="flex items-center gap-2">
          <GalleryFilter mode="grid" viewMode="grid" setViewMode={() => {}} />
          <GalleryFilter mode="rows" viewMode="grid" setViewMode={() => {}} />
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-brand-w1/30">
        <InfoItem
          label="Client"
          value={
            <span className="flex items-center gap-1">
              {entry.icon ? (
                <span className="relative size-6 overflow-hidden rounded-full bg-brand-g2">
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
          value={entry.project?.categories?.map((c) => c._title).join(", ")}
        />
      </ul>
    </div>
  )
}

const InfoItem = ({ label, value }: { label: string; value: ReactNode }) => {
  return (
    <li className="grid grid-cols-6 items-center py-1">
      <span className="col-span-2 text-p text-brand-g1">{label}</span>
      <span className="col-span-4 text-p text-brand-w1">{value}</span>
    </li>
  )
}
