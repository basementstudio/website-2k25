"use client"

import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

import { cn } from "@/utils/cn"

import { QueryType } from "./query"

interface HeroProps {
  data: QueryType
  className?: string
}

export const Hero = ({ data, className }: HeroProps) => {
  return (
    <section className={cn("grid-layout !gap-y-4 lg:!gap-y-2", className)}>
      <h1 className="col-span-full text-f-h0-mobile text-brand-w2 lg:col-start-1 lg:col-end-6 lg:text-f-h0">
        Services
      </h1>
      <Image
        alt={data.pages.services.heroImage?.alt ?? "Services image"}
        src={data.pages.services.heroImage?.url ?? ""}
        width={data.pages.services.heroImage?.width}
        height={data.pages.services.heroImage?.height}
        className="col-span-1 lg:col-start-6 lg:col-end-8"
      />
      <div className="col-start-2 col-end-5 flex flex-col gap-4 text-mobile-h4 text-brand-w2 lg:col-start-9 lg:col-end-13 lg:text-h4">
        <RichText content={data.pages.services.intro.json.content} />
      </div>
    </section>
  )
}
