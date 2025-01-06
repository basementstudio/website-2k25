import Link from "next/link"

import { cn } from "@/utils/cn"

import { QueryType } from "./careers-query"

export const OpenPositions = ({ data }: { data: QueryType }) => {
  return (
    <section className="grid-layout pb-[148px]">
      <h2 className="relative z-20 col-start-1 col-end-4 row-start-1 pt-[27px] text-heading uppercase text-brand-w2">
        <span className="block">Open</span>
        <span className="block">Positions</span>
      </h2>

      <ul className="relative col-start-1 col-end-13 row-start-1 text-paragraph text-brand-w2">
        <li className="group relative grid grid-cols-12 gap-2">
          <div className="relative col-start-5 col-end-13 grid grid-cols-8 items-center gap-2 pb-2 text-brand-g1 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w1/20">
            <span className="col-start-1 col-end-5 text-paragraph">Role</span>
            <span className="col-start-5 col-end-7 text-paragraph">Type</span>
            <span className="text-paragraph">Location</span>
          </div>
        </li>
        {data.company.openPositions.openPositionsList.items.map(
          ({ _title, type, location, isOpen }, idx) => (
            <li key={idx} className="group relative grid grid-cols-12 gap-2">
              <Link
                href={""}
                className={cn(
                  "relative col-start-5 col-end-13 grid grid-cols-8 items-center gap-2 py-2 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w2/30",
                  { "text-brand-w1/20": isOpen }
                )}
              >
                <span className="col-start-1 col-end-5 text-subheading">
                  {_title}
                </span>
                <span className="col-start-5 col-end-7 text-paragraph">
                  {type}
                </span>
                <div className="col-start-7 col-end-9 flex w-full justify-between">
                  <span className="text-paragraph">{location}</span>
                  <span className="text-paragraph">
                    {isOpen ? "(closed)" : "Apply for Role →"}
                  </span>
                </div>
              </Link>
              <div
                className={cn(
                  "with-diagonal-lines pointer-events-none !absolute -top-px bottom-0 left-0 right-0 transition-opacity duration-300",
                  {
                    "opacity-0 group-hover:opacity-100": !isOpen,
                    hidden: isOpen
                  }
                )}
              />
            </li>
          )
        )}
      </ul>
    </section>
  )
}
