import Link from "next/link"

import { QueryType } from "./query"

export const Clients = ({ data }: { data: QueryType }) => (
  <section className="grid-layout">
    <div className="col-start-1 col-end-13 grid grid-cols-12 gap-2 border-t border-brand-w1/20">
      <h2 className="col-start-1 col-end-5 pt-1 text-heading uppercase text-brand-w2">
        Clients
      </h2>
      <div className="relative col-start-5 col-end-13 grid grid-cols-8 gap-2">
        <ul className="col-span-5 columns-5 gap-2">
          {data.company.clients.clientList.items
            .sort((a, b) => a._title.localeCompare(b._title))
            .map((client) => (
              <li
                className="actionable pt-0.75 pb-1.25 relative text-paragraph text-brand-w1"
                key={client._title}
              >
                <Link href={client.website ?? ""}>{client._title}</Link>
              </li>
            ))}
          {Array(Math.ceil(data.company.clients.clientList.items.length / 5))
            .fill(null)
            .map((_, index) => (
              <hr
                key={index}
                className="absolute left-0 right-0 w-full border-brand-w1/20"
                style={{ top: `${(index + 1) * 1.5 - 0.0625}rem` }}
              />
            ))}
        </ul>
      </div>
    </div>
  </section>
)
