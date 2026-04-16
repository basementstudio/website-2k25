"use client"

import { useMemo } from "react"

import { InfoItem } from "@/components/primitives/info-item"
import { TextList } from "@/components/primitives/text-list"

import type { ShowcaseProjectDetail } from "./sanity"

export function ProjectPeople({ entry }: { entry: ShowcaseProjectDetail }) {
  const peopleByDepartment = useMemo(() => {
    const departments = new Map<string, string[]>()

    entry.people?.forEach((person) => {
      const dept = person.department?.title || "Other"

      if (!departments.has(dept)) {
        departments.set(dept, [])
      }

      departments.get(dept)?.push(person.title)
    })

    return Array.from(departments.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    )
  }, [entry.people])

  if (peopleByDepartment.length === 0) {
    return null
  }

  return (
    <div className="grid-layout !gap-y-0">
      <h4 className="col-span-full text-f-h4-mobile text-brand-g1 lg:hidden lg:text-f-h4">
        Credits
      </h4>
      <ul className="grid-row-start-2 col-span-5 mt-1.25 flex flex-col divide-y divide-brand-w1/20">
        <div />
        {peopleByDepartment.map(([department, people]) => (
          <InfoItem
            key={department}
            label={department}
            value={<TextList value={people} />}
          />
        ))}
        <div />
      </ul>
    </div>
  )
}
