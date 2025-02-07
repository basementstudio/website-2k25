import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const OpenPositions = ({ data }: { data: QueryType }) => {
  return (
    <section className="grid-layout">
      <h2 className="relative z-20 col-start-1 col-end-5 row-start-1 pt-[27px] text-h1 text-brand-w2">
        Open Positions
      </h2>

      <ul className="relative col-start-1 col-end-13 row-start-1 text-p text-brand-w2">
        <li className="group relative grid grid-cols-12 gap-2">
          <div className="relative col-start-5 col-end-13 grid grid-cols-8 items-center gap-2 pb-2 text-brand-g1 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w2/20">
            <span className="col-start-1 col-end-5 text-h4">Role</span>
            <span className="col-start-5 col-end-7 text-h4">Type</span>
            <span className="text-h4">Location</span>
          </div>
        </li>
        {data.company.openPositions.openPositionsList.items.map(
          ({ _title, type, location, isOpen, applyUrl }, idx) => (
            <li key={idx} className="group relative grid grid-cols-12 gap-2">
              <div
                className={cn(
                  "with-diagonal-lines pointer-events-none !absolute -top-px bottom-0 left-0 right-0 transition-opacity duration-300",
                  {
                    "opacity-0 group-hover:opacity-100": isOpen,
                    hidden: !isOpen
                  }
                )}
              />
              <Link
                href={applyUrl ?? ""}
                className={cn(
                  "relative col-start-5 col-end-13 grid grid-cols-8 items-center gap-2 py-2 transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w2/20 hover:text-brand-w1",
                  { "pointer-events-none text-brand-w2/30": !isOpen }
                )}
              >
                <span className="col-start-1 col-end-5 text-h3">{_title}</span>
                <span className="col-start-5 col-end-7 text-p">{type}</span>
                <div className="col-start-7 col-end-9 flex w-full justify-between">
                  <span className="text-p">{location}</span>
                  <span className="actionable inline-flex items-center gap-1 text-p">
                    {!isOpen ? (
                      "(closed)"
                    ) : (
                      <>
                        Apply Now <Arrow className="size-4" />
                      </>
                    )}
                  </span>
                </div>
              </Link>
            </li>
          )
        )}
      </ul>
    </section>
  )
}
