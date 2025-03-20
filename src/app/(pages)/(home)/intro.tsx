import { RichText } from "basehub/react-rich-text"

import { QueryType } from "./query"

export const Intro = ({ data }: { data: QueryType }) => {
  return (
    <section className="grid-layout">
      <article className="col-span-full flex flex-col gap-4 text-brand-w1 lg:col-span-11">
        <div>
          <RichText
            components={{
              p: ({ children }) => (
                <h1 className="text-pretty text-f-h0-mobile lg:text-[5.4375rem] lg:leading-[4.875rem] 3xl:text-f-h0">
                  {children}
                </h1>
              )
            }}
          >
            {data.pages.homepage.intro.title?.json.content}
          </RichText>
        </div>
        <div className="w-full lg:w-[60%]">
          <RichText
            components={{
              p: ({ children }) => (
                <p className="text-f-h4-mobile lg:text-f-h4 text-balance">
                  {children}
                </p>
              )
            }}
          >
            {data.pages.homepage.intro.subtitle?.json.content}
          </RichText>
        </div>
      </article>
    </section>
  )
}
