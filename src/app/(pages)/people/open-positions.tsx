import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const OpenPositions = ({ data }: { data: QueryType }) => {
  return (
    <section className="grid-layout !gap-y-6 lg:!gap-y-2">
      <h2 className="relative z-20 col-span-full text-mobile-h1 text-brand-w2 lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:text-h1">
        Open Positions
      </h2>

      <ul className="relative col-span-full text-p text-brand-w2 lg:row-start-1">
        <li className="group relative grid grid-cols-12 gap-2">
          <div className="relative col-span-full grid grid-cols-8 items-center gap-2 pb-2 text-brand-g1 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w2/20 lg:col-start-5 lg:col-end-13">
            <span className="col-start-1 col-end-5 text-mobile-h4 lg:text-h4">
              Role
            </span>
            <span className="col-start-5 col-end-7 text-mobile-h4 lg:text-h4">
              Type
            </span>
            <span className="text-mobile-h4 lg:text-h4">Location</span>
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
                  "relative col-span-full grid grid-cols-8 items-start gap-2 py-2 transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w2/20 hover:text-brand-w1 lg:col-start-5 lg:col-end-13 lg:items-center",
                  { "pointer-events-none text-brand-w2/30": !isOpen }
                )}
              >
                <span className="col-start-1 col-end-5 text-mobile-h3 lg:text-h3">
                  {_title}
                </span>
                <span className="col-start-5 col-end-7 text-mobile-p lg:text-p">
                  {type}

                  <span className="actionable flex items-center gap-1 pt-4 text-mobile-p lg:hidden lg:text-p">
                    {!isOpen ? (
                      "(closed)"
                    ) : (
                      <>
                        Apply Now <Arrow className="size-4" />
                      </>
                    )}
                  </span>
                </span>
                <div className="col-start-7 col-end-9 flex w-full justify-between">
                  <span className="text-mobile-p lg:text-p">{location}</span>
                  <span className="actionable hidden items-center gap-1 text-mobile-p lg:inline-flex lg:text-p">
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
