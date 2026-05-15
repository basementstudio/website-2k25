"use client"

import { PortableText } from "@portabletext/react"

import { SanityImage } from "@/components/sanity-image"
import { cn } from "@/utils/cn"

import type { ServicesPageData } from "./sanity"

interface HeroProps {
  data: ServicesPageData
  className?: string
}

export const Hero = ({ data, className }: HeroProps) => {
  const heroImage = data.heroImage

  return (
    <section className={cn("grid-layout !gap-y-4 lg:!gap-y-2", className)}>
      <h1 className="col-span-full text-f-h0-mobile text-brand-w2 lg:col-start-1 lg:col-end-6 lg:text-f-h0">
        Services
      </h1>
      <SanityImage
        image={heroImage}
        alt={heroImage?.alt || "Services image"}
        sourceWidth={720}
        className="hidden lg:col-start-6 lg:col-end-9 lg:block"
      />
      <div className="col-start-1 col-end-5 flex flex-col gap-4 text-f-h3-mobile text-brand-w2 lg:col-start-9 lg:col-end-13 lg:text-f-h4">
        {data.intro && <PortableText value={data.intro} />}
      </div>
    </section>
  )
}
