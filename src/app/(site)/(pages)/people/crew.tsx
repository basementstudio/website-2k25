"use client"

import { motion } from "motion/react"
import Image from "next/image"
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"

import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { Placeholder } from "@/components/primitives/placeholder"
import useDebounceValue from "@/hooks/use-debounce-value"
import { useMedia } from "@/hooks/use-media"
import { cn } from "@/utils/cn"

import type { PersonDisplay } from "./sanity"

const DEBOUNCE_TIME = 10

export const Crew = ({ data }: { data: PersonDisplay[] }) => {
  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null)
  const debouncedHoveredPerson = useDebounceValue(hoveredPerson, DEBOUNCE_TIME)
  const heightRef = useRef({
    list: 0,
    faces: 0
  })

  const groupedPeople = useMemo(() => {
    const people = data.reduce(
      (acc, person) => {
        const department = person.department
        if (!department) return acc
        if (!acc[department]) acc[department] = []
        acc[department].push(person)
        return acc
      },
      {} as Record<string, PersonDisplay[]>
    )

    const orderedDepartments = ["Management", "Design", "Development"]

    const sortedPeople: Record<string, PersonDisplay[]> = {}

    orderedDepartments.forEach((dept) => {
      if (people[dept]) {
        sortedPeople[dept] = people[dept].sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
        )
      }
    })

    return sortedPeople
  }, [data])

  const flattenedPeople = useMemo(() => {
    return Object.values(groupedPeople).flat()
  }, [groupedPeople])

  const updateHeightRef = useCallback(() => {
    const listHeight = document.querySelector(".crew-list")?.clientHeight ?? 0
    const facesHeight = document.querySelector(".crew-faces")?.clientHeight ?? 0

    heightRef.current = { list: listHeight, faces: facesHeight }
  }, [])

  useLayoutEffect(() => {
    updateHeightRef()

    window.addEventListener("resize", updateHeightRef)

    return () => {
      window.removeEventListener("resize", updateHeightRef)
    }
  }, [updateHeightRef])

  return (
    <section className="grid-layout mb-18 lg:mb-48">
      <div className="col-span-full -mb-6 flex items-end justify-between lg:col-start-5 lg:col-end-13">
        <h2 className="text-f-h1-mobile text-brand-w2 lg:text-f-h1">
          The Crew
        </h2>
        <p className="text-f-h1-mobile text-brand-g1 lg:text-f-h1">
          {data.length}
        </p>
      </div>
      <div
        className={cn(
          "crew-list hidden flex-col gap-5 lg:col-start-1 lg:col-end-5 lg:flex",
          {
            "lg:sticky lg:top-8":
              heightRef.current.faces > heightRef.current.list
          }
        )}
      >
        {Object.entries(groupedPeople).map(([department, people], index) => (
          <div key={department}>
            <div className="grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-1">
              {index === 0 && (
                <p className="text-f-h4-mobile text-brand-g1 lg:text-f-h4">
                  A-Z
                </p>
              )}
              <p className="col-start-2 text-f-h4-mobile text-brand-g1 lg:text-f-h4">
                {department}
              </p>
            </div>

            <ul className="text-f-p-mobile text-brand-w1 lg:text-f-p">
              {people.map((person) => (
                <li
                  key={person.title}
                  className={cn(
                    "group relative grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-1 pt-0.75 transition-colors duration-200",
                    debouncedHoveredPerson &&
                      debouncedHoveredPerson !== person.title &&
                      "!text-brand-w1/50"
                  )}
                  onMouseEnter={() => setHoveredPerson(person.title)}
                  onMouseLeave={() => setHoveredPerson(null)}
                >
                  <div
                    className={cn(
                      "with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-200",
                      {
                        "opacity-100": debouncedHoveredPerson === person.title
                      }
                    )}
                  />
                  <div
                    className="col-span-1 line-clamp-1 hidden lg:inline xl:hidden"
                    title={person.title}
                  >
                    {person.title.split(" ")[0]}
                  </div>
                  <div
                    className="col-span-1 line-clamp-1 lg:hidden xl:inline"
                    title={person.title}
                  >
                    {person.title}
                  </div>
                  <div className="col-span-3 flex justify-between gap-1">
                    <span className="line-clamp-1">{person.role}</span>
                    <div className="flex gap-1 text-right">
                      {person.socialNetworks.map(
                        (socialNetwork, index) => (
                          <Fragment key={index}>
                            <Link
                              href={socialNetwork.url}
                              target="_blank"
                              className="bg-brand-0"
                            >
                              <span className="actionable">
                                {socialNetwork.platform}
                              </span>
                            </Link>
                            {index < person.socialNetworks.length - 1 && (
                              <span className="text-brand-g1">,</span>
                            )}
                          </Fragment>
                        )
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <DesktopFaces
        data={flattenedPeople}
        setHoveredPerson={setHoveredPerson}
        hoveredPerson={debouncedHoveredPerson}
        heightRef={heightRef.current}
      />
      <MobileFaces data={groupedPeople} />
    </section>
  )
}

interface DesktopFacesProps {
  data: PersonDisplay[]
  setHoveredPerson: (person: string | null) => void
  hoveredPerson: string | null
  heightRef: { list: number; faces: number }
}

export const DesktopFaces = ({
  data,
  setHoveredPerson,
  hoveredPerson,
  heightRef
}: DesktopFacesProps) => {
  const isXl = useMedia("(min-width: 1536px)")
  const gridCols = isXl ? 8 : 6

  return (
    <div
      className={cn(
        "crew-faces col-span-full hidden h-fit grid-cols-6 gap-2 pt-6 lg:col-start-5 lg:col-end-13 lg:grid 2xl:grid-cols-8",
        { "sticky top-8": heightRef.list > heightRef.faces }
      )}
    >
      {data.map((person) => (
        <Face
          key={person.title}
          person={person}
          setHoveredPerson={setHoveredPerson}
          hoveredPerson={hoveredPerson}
        />
      ))}
      <CrewFooter
        spanStart={gridCols - (data.length % gridCols)}
        spanEnd={gridCols - (data.length % gridCols)}
      />
    </div>
  )
}

interface MobileFacesProps {
  data: Record<string, PersonDisplay[]>
}

export const MobileFaces = ({ data }: MobileFacesProps) => (
  <div className="col-span-full flex flex-col gap-4 py-6 lg:hidden">
    {Object.entries(data).map(([department, people]) => (
      <article key={department} className="flex flex-col gap-2">
        <p className="text-f-h4-mobile text-brand-g1 lg:text-f-h4">
          {department}
        </p>

        <div className="grid grid-cols-4 gap-2">
          {people.map((person) => (
            <div
              key={person.title}
              className="with-dots group relative aspect-[83/96] bg-brand-k text-brand-w1/20 lg:aspect-[136/156]"
            >
              <div className="after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
                {person.image ? (
                  <Image src={person.image.url} alt={person.title} fill />
                ) : (
                  <Placeholder width={134} height={156} />
                )}
              </div>
            </div>
          ))}

          <div
            className={cn(
              "relative h-full w-full border border-brand-w1/20 text-brand-w1/20",
              { hidden: people.length % 4 === 0 }
            )}
            style={{
              gridColumn: `span ${4 - (people.length % 4)} / span ${4 - (people.length % 4)}`
            }}
          >
            <div className="with-dots !absolute -inset-px" />
            <div className="with-diagonal-lines absolute inset-0 h-full w-full" />
          </div>
        </div>
      </article>
    ))}

    <CrewFooter spanStart={1} spanEnd={13} />
  </div>
)

interface FaceProps {
  person: PersonDisplay
  setHoveredPerson: (person: string | null) => void
  hoveredPerson: string | null
}

export const Face = ({
  person,
  setHoveredPerson,
  hoveredPerson
}: FaceProps) => (
  <motion.div
    key={person.title}
    className="with-dots group relative aspect-[83/96] bg-brand-k text-brand-w1/20 lg:aspect-[136/156]"
    onMouseEnter={() => setHoveredPerson(person.title)}
    onMouseLeave={() => setHoveredPerson(null)}
    animate={{
      opacity: hoveredPerson ? (hoveredPerson === person.title ? 1 : 0.5) : 1
    }}
    transition={{ duration: 0.2, ease: "easeInOut" }}
  >
    <div className="after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
      {person.image ? (
        <Image
          src={person.image.url}
          alt={person.title}
          fill
          className="transition-opacity duration-200"
        />
      ) : (
        <Placeholder width={134} height={156} />
      )}
    </div>

    <div
      className={cn(
        "with-diagonal-lines pointer-events-none !absolute inset-0 opacity-0 transition-opacity duration-200",
        { "opacity-100": hoveredPerson === person.title }
      )}
    />
  </motion.div>
)

interface CrewFooterProps {
  spanStart: number
  spanEnd: number
}

export const CrewFooter = ({ spanStart, spanEnd }: CrewFooterProps) => {
  const scrollToOpenPositions = useCallback(() => {
    document.getElementById("open-positions")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    })
  }, [])

  return (
    <div
      className="with-diagonal-lines relative col-span-full flex min-h-32 items-center justify-center bg-brand-k"
      style={{
        gridColumn: `span ${spanStart} / span ${spanEnd}`
      }}
    >
      <button
        type="button"
        onClick={scrollToOpenPositions}
        className="relative z-10 flex h-4 items-center gap-1 bg-brand-k text-f-p-mobile text-brand-w1 lg:text-f-p"
      >
        <span className="actionable flex items-center gap-1">
          Join the Crew <Arrow className="size-4" />
        </span>
      </button>
    </div>
  )
}
