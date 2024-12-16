import Link from "next/link"

import { QueryType } from "./query"

export const People = ({ data }: { data: QueryType }) => {
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
    <section className="grid-layout">
      <h2 className="col-start-5 col-end-13 -mb-6 text-heading uppercase text-brand-w2">
        The Crew
      </h2>
      <div className="col-start-1 col-end-5 flex flex-col gap-6">
        {Object.entries(groupedPeople).map(([department, people], index) => (
          <div key={department}>
            <div className="grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-2">
              {index === 0 && (
                <p className="text-paragraph text-brand-g1">A-Z</p>
              )}
              <p className="col-start-2 text-paragraph text-brand-g1">
                {department}
              </p>
            </div>

            <ul className="text-paragraph text-brand-w1">
              {people.map((person) => (
                <li
                  key={person._title}
                  className="group relative grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-0.5 pt-px"
                >
                  <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="col-span-1">{person._title}</div>
                  <div className="col-span-1">{person.role}</div>
                  <div className="col-span-2">
                    <a className="actionable text-w2">LinkedIn</a> /{" "}
                    <a className="actionable text-w2">Email</a>
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
            className="with-dots aspect-[136/156] border border-brand-w1/20 bg-brand-k text-brand-w1/20"
          >
            <svg
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 134 156"
            >
              <path d="M0-.00024414 134 156" />
            </svg>
          </div>
        ))}
        <div
          className="with-diagonal-lines relative col-span-7 flex items-center justify-center bg-brand-k"
          style={{
            gridColumn: `span ${8 - (data.company.people.peopleList.items.length % 8)} / span ${8 - (data.company.people.peopleList.items.length % 8)}`
          }}
        >
          <Link href="/" className="relative z-10 block bg-brand-k">
            <span className="actionable text-paragraph text-brand-w1">
              Apply Here →
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
