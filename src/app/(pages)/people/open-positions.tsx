import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const OpenPositions = ({ data }: { data: QueryType }) => (
  <section className="grid-layout !gap-y-4 pb-24 lg:!gap-y-2">
    <h2 className="relative z-20 col-span-full text-f-h1-mobile text-brand-w2 lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:text-f-h1">
      Open <br className="hidden lg:block" />
      Positions
    </h2>

    <ul className="relative col-span-full text-brand-w2 lg:row-start-1">
      <li className="group relative grid grid-cols-12 gap-2">
        <div className="relative col-span-full grid grid-cols-8 items-center gap-2 pb-2 text-brand-g1 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w2/20 lg:col-start-5 lg:col-end-13">
          <span className="col-start-1 col-end-5 text-f-h4-mobile lg:text-f-h4">
            Role
          </span>
          <span className="col-start-5 col-end-7 text-f-h4-mobile lg:text-f-h4">
            Type
          </span>
          <span className="hidden text-f-h4-mobile lg:inline-block lg:text-f-h4">
            Location
          </span>
        </div>
      </li>
      {data.company.openPositions.openPositionsList.items.map(
        ({ _title, type, location, isOpen, applyUrl }, idx) => (
          <li key={idx} className="h- group relative grid grid-cols-12 gap-2">
            <Link
              href={applyUrl ?? ""}
              target="_blank"
              className={cn(
                "relative col-span-full grid grid-cols-8 items-start gap-2 py-4 transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:w-full after:border-b after:border-brand-w2/20 hover:text-brand-w1 lg:col-start-5 lg:col-end-13 lg:items-center lg:py-2",
                { "pointer-events-none text-brand-w2/30": !isOpen }
              )}
            >
              <div
                className={cn(
                  "with-diagonal-lines pointer-events-none !absolute -top-px bottom-0 left-0 right-0 transition-opacity duration-300",
                  {
                    "opacity-0 group-hover:opacity-100": isOpen,
                    hidden: !isOpen
                  }
                )}
              />
              <span className="col-start-1 col-end-5 text-f-h3-mobile lg:text-f-h3">
                {_title}
              </span>
              <div className="col-start-5 col-end-7 flex flex-col text-f-p-mobile lg:text-f-p">
                <p>{type}</p>
              </div>
              <div className="col-start-7 col-end-9 flex w-full items-center justify-end lg:justify-between">
                <span className="hidden text-f-p-mobile lg:inline-block lg:text-f-p">
                  {location}
                </span>
                <p className="actionable mt-[3px] gap-0.5 text-f-p-mobile lg:mt-0 lg:text-f-p">
                  {!isOpen ? (
                    "(closed)"
                  ) : (
                    <>
                      Apply
                      <span className="hidden lg:block [@media(width:1024px)]:hidden">
                        Now
                      </span>
                      <Arrow className="size-4" />
                    </>
                  )}
                </p>
              </div>
            </Link>
          </li>
        )
      )}
    </ul>
  </section>
)
