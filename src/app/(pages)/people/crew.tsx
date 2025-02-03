"use client"

import Image from "next/image"
import { Fragment, useState } from "react"

import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { Placeholder } from "@/components/primitives/placeholder"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const Crew = ({ data }: { data: QueryType }) => {
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null)

  const groupedPeople = data.company.people.peopleList.items.reduce(
    (acc, person) => {
      const department = person.department._title
      if (!acc[department]) acc[department] = []
      acc[department].push(person)
      return acc
    },
    {} as Record<string, typeof data.company.people.peopleList.items>
  )

  return (
    <section className="grid-layout mb-44">
      <div className="col-start-5 col-end-13 -mb-6 flex items-end justify-between">
        <h2 className="text-h2 text-brand-w2">The Crew</h2>
        <p className="text-h1 text-brand-g1">
          x{data.company.people.peopleList.items.length}
        </p>
      </div>
      <div className="col-start-1 col-end-5 flex flex-col gap-5">
        {Object.entries(groupedPeople).map(([department, people], index) => (
          <div key={department}>
            <div className="grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-1">
              {index === 0 && <p className="text-h4 text-brand-g1">A-Z</p>}
              <p className="col-start-2 text-h4 text-brand-g1">{department}</p>
            </div>

            <ul className="text-p text-brand-w1">
              {people.map((person) => (
                <li
                  key={person._title}
                  className="group relative grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-1 pt-0.75"
                  onMouseEnter={() => setHoveredPerson(person._title)}
                  onMouseLeave={() => setHoveredPerson(null)}
                >
                  <div
                    className={cn(
                      "with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300",
                      { "opacity-100": hoveredPerson === person._title }
                    )}
                  />
                  <div className="col-span-1">{person._title}</div>
                  <div className="col-span-1">{person.role}</div>
                  <div className="col-span-2 flex justify-end gap-1 text-right text-brand-g1">
                    {person.socialNetworks.items.map(
                      (socialNetwork: any, index: number) => (
                        <Fragment key={index}>
                          <Link
                            href={socialNetwork.link as string}
                            className="actionable bg-brand-0 text-brand-w1"
                          >
                            {socialNetwork.platform}
                          </Link>
                          {index < person.socialNetworks.items.length - 1 && (
                            <span>,</span>
                          )}
                        </Fragment>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="col-start-5 col-end-13 grid h-fit grid-cols-8 gap-2 pt-6">
        {data.company.people.peopleList.items.map((person) => (
          <div
            key={person._title}
            className={
              "with-dots group relative aspect-[136/156] bg-brand-k text-brand-w1/20"
            }
            onMouseEnter={() => setHoveredPerson(person._title)}
            onMouseLeave={() => setHoveredPerson(null)}
          >
            <div className="after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
              {person.image ? (
                <Image src={person.image.url} alt={person._title} fill />
              ) : (
                <Placeholder width={134} height={156} />
              )}
            </div>

            <div
              className={cn(
                "with-diagonal-lines pointer-events-none !absolute inset-0 opacity-0 transition-opacity duration-300",
                { "opacity-100": hoveredPerson === person._title }
              )}
            />
          </div>
        ))}
        <div
          className="with-diagonal-lines relative col-span-7 flex items-center justify-center bg-brand-k"
          style={{
            gridColumn: `span ${8 - (data.company.people.peopleList.items.length % 8)} / span ${8 - (data.company.people.peopleList.items.length % 8)}`
          }}
        >
          <Link
            href="/"
            className="relative z-10 flex h-4 gap-1 bg-brand-k text-p text-brand-w1"
          >
            <span className="actionable">Join the Crew</span>{" "}
            <Arrow className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
