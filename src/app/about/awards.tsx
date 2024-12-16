import Link from "next/link"

import { formatDate } from "@/utils/format-date"

import { QueryType } from "./query"

export const Awards = ({ data }: { data: QueryType }) => (
  <div className="grid-layout">
    <h2 className="relative z-20 col-start-1 col-end-3 row-start-1 text-heading uppercase text-brand-w2">
      Awards
    </h2>
    <p className="relative z-20 col-start-3 col-end-4 row-start-1 text-heading uppercase text-brand-g2">
      x25
    </p>
    <ul className="relative col-start-1 col-end-13 row-start-1 mt-2 text-paragraph text-brand-w1">
      {data.company.awards.awardList.items
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((award) => (
          <li
            key={award._id}
            className="group relative grid grid-cols-12 gap-2 [&:first-child>.item]:after:absolute [&:first-child>.item]:after:-top-px [&:first-child>.item]:after:left-0 [&:first-child>.item]:after:w-full [&:first-child>.item]:after:border-t [&:first-child>.item]:after:border-brand-w1/20"
          >
            <Link
              href={award.url ?? ""}
              className="item relative col-start-5 col-end-13 grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-0.5 pt-px"
            >
              <span className="col-span-1">{award.title}</span>
              <span className="col-span-1">{award.project._title}</span>
              <span className="col-span-1">{formatDate(award.date)}</span>
            </Link>
            <div className="with-diagonal-lines pointer-events-none !absolute -top-px bottom-0 left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </li>
        ))}
    </ul>
  </div>
)
