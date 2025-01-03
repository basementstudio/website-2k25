import Link from "next/link"
import { QueryType } from "./careers-query"

export const OpenPositions = ({ data }: { data: QueryType }) => {
  return (
    <section className="grid-layout">
      <h2 className="relative z-20 col-start-1 col-end-4 row-start-1 text-heading uppercase text-brand-w2">
        <span className="block">OPEN</span>
        <span className="block">POSITIONS</span>
      </h2>

      <ul className="relative col-start-1 col-end-13 row-start-1 text-paragraph text-brand-w1">
        {data.company.openPositions.openPositionsList.items.map(
          ({ _title, text, text_1, boolean }, idx) => (
            <li
              key={idx}
              className="group relative grid grid-cols-12 gap-2 [&:first-child>.item]:after:absolute [&:first-child>.item]:after:-top-px [&:first-child>.item]:after:left-0 [&:first-child>.item]:after:w-full [&:first-child>.item]:after:border-t [&:first-child>.item]:after:border-brand-w1/20"
            >
              <Link
                href={""}
                className="item relative col-start-5 col-end-13 grid grid-cols-8 items-center gap-2 py-2 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w1/20"
              >
                <span className="col-start-1 col-end-5 text-subheading">
                  {_title}
                </span>
                <span className="col-start-5 col-end-7 text-paragraph">
                  {text}
                </span>
                <div className="col-start-7 col-end-9 flex w-full justify-between">
                  <span className="text-paragraph">{text_1}</span>
                  <span className="text-paragraph">
                    {boolean ? "(closed)" : "Apply for Role →"}
                  </span>
                </div>
              </Link>
              <div className="with-diagonal-lines pointer-events-none !absolute -top-px bottom-0 left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </li>
          )
        )}
      </ul>
    </section>
  )
}
