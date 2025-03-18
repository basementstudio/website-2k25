"use client"

import Image from "next/image"
import { Fragment, useEffect, useRef, useState } from "react"

import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { Placeholder } from "@/components/primitives/placeholder"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const Crew = ({ data }: { data: QueryType }) => {
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null)
  const heightRef = useRef({
    list: 0,
    faces: 0
  })

  const groupedPeople = data.company.people.peopleList.items.reduce(
    (acc, person) => {
      const department = person.department._title
      if (!acc[department]) acc[department] = []
      acc[department].push(person)
      return acc
    },
    {} as Record<string, typeof data.company.people.peopleList.items>
  )

  // sorting a - z
  Object.keys(groupedPeople).forEach((department) => {
    groupedPeople[department].sort((a, b) =>
      a._title.localeCompare(b._title, undefined, { sensitivity: "base" })
    )
  })

  useEffect(() => {
    const listHeight = document.querySelector(".crew-list")?.clientHeight ?? 0
    const facesHeight = document.querySelector(".crew-faces")?.clientHeight ?? 0

    heightRef.current = { list: listHeight, faces: facesHeight }
  }, [])

  return (
    <section className="grid-layout mb-18 lg:mb-44">
      <div className="col-span-full -mb-6 flex items-end justify-between lg:col-start-5 lg:col-end-13">
        <h2 className="text-f-h1-mobile text-brand-w2 lg:text-f-h1">
          The Crew
        </h2>
        <p className="text-f-h1-mobile text-brand-g1 lg:text-f-h1">
          {data.company.people.peopleList.items.length}
        </p>
      </div>
      <div
        className={cn(
          "crew-list hidden flex-col gap-5 lg:col-start-1 lg:col-end-5 lg:flex",
          // make it sticky if the list is taller than the faces
          { "sticky top-8": heightRef.current.list > heightRef.current.faces }
        )}
      >
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
                            target="_blank"
                            className="bg-brand-0 text-brand-w1"
                          >
                            <span className="actionable">
                              {socialNetwork.platform}
                            </span>
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
      <DesktopFaces
        data={data}
        setHoveredPerson={setHoveredPerson}
        hoveredPerson={hoveredPerson}
        heightRef={heightRef.current}
      />
      <MobileFaces
        data={groupedPeople}
        setHoveredPerson={setHoveredPerson}
        hoveredPerson={hoveredPerson}
      />
    </section>
  )
}

export const DesktopFaces = ({
  data,
  setHoveredPerson,
  hoveredPerson,
  heightRef
}: {
  data: QueryType
  setHoveredPerson: (person: string | null) => void
  hoveredPerson: string | null
  heightRef: { list: number; faces: number }
}) => {
  return (
    <div
      className={cn(
        "crew-faces col-span-full hidden h-fit grid-cols-8 gap-2 pt-6 lg:col-start-5 lg:col-end-13 lg:grid",
        { "sticky top-8": heightRef.list > heightRef.faces }
      )}
    >
      {data.company.people.peopleList.items.map((person) => (
        <Face
          key={person._title}
          person={person}
          setHoveredPerson={setHoveredPerson}
          hoveredPerson={hoveredPerson}
        />
      ))}
      <CrewFooter
        spanStart={8 - (data.company.people.peopleList.items.length % 8)}
        spanEnd={8 - (data.company.people.peopleList.items.length % 8)}
      />
    </div>
  )
}

export const MobileFaces = ({
  data,
  setHoveredPerson,
  hoveredPerson
}: {
  data: Record<string, QueryType["company"]["people"]["peopleList"]["items"]>
  setHoveredPerson: (person: string | null) => void
  hoveredPerson: string | null
}) => {
  return (
    <div className="col-span-full flex flex-col gap-4 py-6 lg:hidden">
      {Object.entries(data).map(([department, people]) => (
        <article key={department} className="flex flex-col gap-2">
          <p className="text-mobile-h4 text-brand-g1">{department}</p>

          <div className="grid grid-cols-4 gap-2">
            {people.map((person) => (
              <Face
                key={person._title}
                person={person}
                setHoveredPerson={setHoveredPerson}
                hoveredPerson={hoveredPerson}
              />
            ))}

            {/* placeholder for empty columns */}
            <div
              className={cn(
                "with-dots relative h-full w-full border border-brand-w1/20 text-brand-w1/20",
                { hidden: people.length % 4 === 0 }
              )}
              style={{
                gridColumn: `span ${4 - (people.length % 4)} / span ${4 - (people.length % 4)}`
              }}
            >
              <div className="with-diagonal-lines absolute inset-0 h-full w-full" />
            </div>
          </div>
        </article>
      ))}

      <CrewFooter spanStart={1} spanEnd={13} />
    </div>
  )
}

export const Face = ({
  person,
  setHoveredPerson,
  hoveredPerson
}: {
  person: QueryType["company"]["people"]["peopleList"]["items"][0]
  setHoveredPerson: (person: string | null) => void
  hoveredPerson: string | null
}) => {
  return (
    <div
      key={person._title}
      className={
        "with-dots group relative aspect-[83/96] bg-brand-k text-brand-w1/20 lg:aspect-[136/156]"
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
  )
}

export const CrewFooter = ({
  spanStart,
  spanEnd
}: {
  spanStart: number
  spanEnd: number
}) => {
  return (
    <div
      className="with-diagonal-lines relative col-span-full flex min-h-32 items-center justify-center bg-brand-k"
      style={{
        gridColumn: `span ${spanStart} / span ${spanEnd}`
      }}
    >
      <Link
        href="/"
        target="_blank"
        className="relative z-10 flex h-4 gap-1 bg-brand-k text-p text-brand-w1"
      >
        <span className="actionable flex items-center gap-1">
          Join the Crew <Arrow className="size-4" />
        </span>
      </Link>
    </div>
  )
}
