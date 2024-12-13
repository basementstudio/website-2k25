import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

import { QueryType } from "./query"

export const Hero = ({ data }: { data: QueryType }) => (
  <section className="grid-layout">
    <h1 className="col-start-1 col-end-5 text-heading uppercase text-brand-w2">
      About Us
    </h1>
    <Image
      src={data.pages.about.imageSequence.items[0].image.url}
      width={data.pages.about.imageSequence.items[0].image.width}
      height={data.pages.about.imageSequence.items[0].image.height}
      alt=""
      className="col-start-5 col-end-7 pt-1"
    />
    <div className="col-start-9 col-end-12 pt-1 text-paragraph text-brand-w2">
      <RichText content={data.pages.about.intro.json.content} />
    </div>
  </section>
)
