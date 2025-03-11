import { Categories } from "@/components/blog/categories"

import { Featured } from "./featured"
import { Hero } from "./hero"

export default function BlogLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div id="blog" className="-translate-y-[36px]" />
      <div className="pb-25 relative flex flex-col gap-12 bg-brand-k lg:gap-20">
        <Hero />
        <Featured />
        <div
          className="col-span-full grid w-full grid-cols-12 gap-x-2 border-brand-w1/20 py-10 lg:col-start-1"
          id="list"
        >
          <div className="col-span-full grid grid-cols-12 items-end gap-2 border-b border-brand-w1/20 pb-2">
            <h2 className="col-span-full text-mobile-h3 text-brand-g1 lg:col-span-3 lg:col-start-5 lg:text-h3">
              More News
            </h2>
            <Categories />
          </div>
          {children}
        </div>
      </div>
    </>
  )
}
