import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  fetchOpenPositions,
  fetchPeopleForMarkdown,
  fetchPeoplePage,
  fetchValuesForMarkdown
} from "@/app/(site)/(canvas)/(content)/people/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
import { MachineHeader } from "@/app/ai/machine-header"
import { MachinePortableText } from "@/app/ai/machine-portable-text"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { displayPlatform, platformAriaLabel } from "@/utils/social-platform"

export const metadata: Metadata = {
  title: "People machine view",
  description:
    "Plain-text mirror of the basement.studio crew for AI agents and crawlers: team, values, and open positions.",
  // The human people page is the canonical document; this page is a styled mirror.
  alternates: { canonical: "https://basement.studio/people" }
}

// Same department whitelist and order the HTML crew page renders (see crew.tsx)
const CREW_DEPARTMENTS = ["Management", "Design", "Development"]

const MachinePeoplePage = async () => {
  const [page, people, positions, values] = await Promise.all([
    fetchPeoplePage(),
    fetchPeopleForMarkdown(),
    fetchOpenPositions(),
    fetchValuesForMarkdown()
  ])

  if (!page) notFound()

  const crew = people.filter(
    (person) =>
      person.department?.title &&
      CREW_DEPARTMENTS.includes(person.department.title)
  )

  // Closed roles are dropped — /ai/careers/[slug] 404s on them, so linking one
  // would be a dead link.
  const openPositions = positions.filter((position) => position.isOpen)

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile text-machine-base lg:text-f-p">
        {/* Header/meta stay uppercase like the /ai index; Portable Text bodies
          keep their authored casing for readability. */}
        <header className="flex flex-col gap-4 uppercase">
          <MachineHeader current="/ai/people" />
          <h1 className="text-machine-bright">basement.studio :: people</h1>
          <p className="text-machine-dim">
            # the crew behind basement.studio, machine-readable.
          </p>
          <dl className="flex flex-col gap-1">
            <Field label="crew">{crew.length}</Field>
            <Field label="markdown">
              <a href="/people.md" className={linkClass}>
                /people.md
              </a>
            </Field>
            <Field label="human">
              <a href="/people" className={linkClass}>
                /people
              </a>
            </Field>
          </dl>
        </header>

        {page.subheading1?.length || page.subheading2?.length ? (
          <Section title="intro">
            <MachinePortableText blocks={page.subheading1} />
            <MachinePortableText blocks={page.subheading2} />
          </Section>
        ) : null}

        {crew.length ? (
          <Section title="team">
            <div className="flex flex-col gap-3 uppercase">
              {CREW_DEPARTMENTS.map((department) => {
                const departmentPeople = crew.filter(
                  (person) => person.department?.title === department
                )
                if (!departmentPeople.length) return null
                return (
                  <div key={department} className="flex flex-col gap-1">
                    <h3 className="text-machine-bright">* {department}</h3>
                    <ul className="flex flex-col gap-1">
                      {departmentPeople.map((person) => (
                        <li key={person.title}>
                          {"- "}
                          {person.title}
                          {person.role ? (
                            <span className="text-machine-dim">
                              {" "}
                              — {person.role}
                            </span>
                          ) : null}
                          {person.socialNetworks?.map((social) => (
                            <span key={social.url}>
                              {" "}
                              <a
                                href={social.url}
                                rel="noopener"
                                aria-label={platformAriaLabel(social.platform)}
                                className={linkClass}
                              >
                                {displayPlatform(social.platform)}
                              </a>
                            </span>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </Section>
        ) : null}

        {values.length ? (
          <Section title="values">
            <ul className="flex flex-col gap-3">
              {values.map((value) => (
                <li key={value._key} className="flex flex-col gap-1">
                  <h3 className="uppercase text-machine-bright">
                    * {value.title}
                  </h3>
                  <MachinePortableText blocks={value.description} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="open_positions">
          <MachinePortableText blocks={page.preOpenPositionsText} />
          {openPositions.length ? (
            <ul className="flex flex-col gap-1 uppercase">
              {openPositions.map((position) => {
                const detail = [position.type, position.location]
                  .filter(Boolean)
                  .join(", ")
                return (
                  <li key={position.slug}>
                    {"- "}
                    <a
                      href={`/ai/careers/${position.slug}`}
                      className={linkClass}
                    >
                      {position.title}
                    </a>
                    {detail ? ` (${detail})` : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="uppercase">none currently open</p>
          )}
        </Section>

        <footer className="flex flex-col gap-1 uppercase text-machine-dim">
          <p>
            <a href="/ai" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/people" className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachinePeoplePage
