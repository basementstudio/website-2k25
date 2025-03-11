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

        <section className="grid-layout pb-[35px] pt-12" id="list">
          <div className="col-span-full grid grid-cols-12 gap-2">
            <h2 className="col-span-full mt-auto text-mobile-h3 text-brand-g1 lg:col-span-3 lg:col-start-5 lg:text-h3">
              More News
            </h2>
            <Categories />
          </div>
          {children}
        </section>
      </div>
    </>
  )
}
