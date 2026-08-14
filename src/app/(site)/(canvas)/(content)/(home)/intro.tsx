import { PortableText } from "@portabletext/react"

import type { HomepageData } from "./sanity"

export const Intro = ({ data }: { data: HomepageData }) => {
  return (
    <section className="grid-layout">
      <article className="col-span-full flex flex-col gap-4 text-brand-w1 lg:col-span-11">
        <div>
          {data.homepage.introTitle ? (
            <PortableText
              value={data.homepage.introTitle}
              components={{
                block: {
                  normal: ({ children }) => (
                    <h1 className="text-pretty text-f-h0-mobile lg:text-[5.4375rem] lg:leading-[4.875rem] 3xl:text-f-h0">
                      {children}
                    </h1>
                  )
                }
              }}
            />
          ) : null}
        </div>
        <div className="w-full lg:w-[60%]">
          {data.homepage.introSubtitle ? (
            <PortableText
              value={data.homepage.introSubtitle}
              components={{
                block: {
                  normal: ({ children }) => (
                    <p className="text-balance text-f-h4-mobile lg:text-f-h4">
                      {children}
                    </p>
                  )
                }
              }}
            />
          ) : null}
        </div>
      </article>
    </section>
  )
}
