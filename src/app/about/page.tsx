import { Pump, PumpQuery } from "basehub/react-pump"
import Link from "next/link"

import { formatDate } from "@/utils/format-date"

import { Hero } from "./hero"
import { query } from "./query"
import { Services } from "./services"

const About = () => (
  <Pump queries={[query]} next={{ revalidate: 30 }}>
    {async ([data]) => {
      "use server"

      if (!data) return null

      const groupedClients = data.company.clients.clientList.items
        .sort((a, b) => a._title.localeCompare(b._title))
        .reduce(
          (acc, client, index) => {
            const groupIndex = Math.floor(
              index /
                Math.ceil(data.company.clients.clientList.items.length / 5)
            )
            if (!acc[groupIndex]) acc[groupIndex] = []
            acc[groupIndex].push(client)
            return acc
          },
          {} as Record<number, typeof data.company.clients.clientList.items>
        )

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
        <main className="relative flex flex-col gap-49 bg-brand-k pt-2">
          <Hero data={data} />
          <Services data={data} />

          <div className="grid-layout">
            <h2 className="col-start-1 col-end-5 text-heading uppercase text-brand-w2">
              Clients
            </h2>
            <div className="col-start-5 col-end-10 grid grid-cols-5 gap-2">
              {Object.entries(groupedClients).map(([groupIndex, clients]) => (
                <div key={groupIndex} className="col-span-1">
                  <ul>
                    {clients.sort().map((client) => (
                      <li
                        className="actionable text-paragraph leading-5 text-brand-w1"
                        key={client._title}
                      >
                        {client._title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-layout">
            <div className="col-start-1 col-end-5 flex flex-col gap-6">
              {Object.entries(groupedPeople).map(
                ([department, people], index) => (
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
                )
              )}
            </div>
            <div className="col-start-5 col-end-13 grid h-fit grid-cols-8 gap-2 pt-5">
              {data.company.people.peopleList.items.map((person) => (
                <div
                  key={person._title}
                  className="with-dots aspect-[136/156] border border-brand-w1/20 text-brand-w1/20"
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
              <div className="with-diagonal-lines relative col-span-7 flex items-center justify-center">
                <Link href="/">
                  <span className="actionable bg-brand-k text-paragraph text-brand-w1">
                    Apply Here →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid-layout">
            <h2 className="relative z-20 col-start-1 col-end-3 row-start-1 text-heading uppercase text-brand-w2">
              Awards
            </h2>
            <p className="relative z-20 col-start-3 col-end-4 row-start-1 text-heading uppercase text-brand-g2">
              x25
            </p>
            <ul className="relative col-start-1 col-end-13 row-start-1 text-paragraph text-brand-w1">
              {data.company.awards.awardList.items
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((award) => (
                  <li
                    key={award._id}
                    className="group relative grid grid-cols-12 gap-2 [&:first-child>.item]:border-t"
                  >
                    <div className="item col-start-5 col-end-13 grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-0.5 pt-px">
                      <div className="col-span-1">{award.title}</div>
                      <div className="col-span-1">{award.project._title}</div>
                      <div className="col-span-1">{formatDate(award.date)}</div>
                    </div>
                    <div className="with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </li>
                ))}
            </ul>
          </div>
        </main>
      )
    }}
  </Pump>
)

export default About
