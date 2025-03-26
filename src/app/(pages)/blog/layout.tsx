import type { Metadata } from "next"

import { Categories } from "@/components/blog/categories"

import { Featured } from "./featured"
import { Hero } from "./hero"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "We don't settle, we are intentional about building with surgical precision and creating extraordinary experiences. We go the extra mile, and then walk a couple more, just for fun."
}

interface BlogLayoutProps {
  children: React.ReactNode
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <>
      <div id="list" className="-translate-y-[3.25rem]" />
      <div className="pb-25 relative flex flex-col gap-12 bg-brand-k lg:gap-20">
        <Hero />
        <Featured />

        <section className="grid-layout pb-[35px] lg:pt-12" id="list">
          <div className="col-span-full -mb-3 grid grid-cols-12 border-brand-w1/20 lg:border-b lg:pb-2">
            <h2 className="col-span-full mt-auto text-f-h3-mobile text-brand-g1 lg:col-span-3 lg:col-start-5 lg:text-f-h3">
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
