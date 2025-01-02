"use client"

import { RichText } from "basehub/react-rich-text"
import Image from "next/image"
import { useRef, useState } from "react"

import { cn } from "@/utils/cn"

import { QueryType } from "./query"

export const Hero = ({
  data,
  className
}: {
  data: QueryType
  className?: string
}) => {
  const [indexImage, setIndexImage] = useState(0)
  const interval = useRef<NodeJS.Timeout | null>(null)

  const cleanup = () => {
    if (interval.current) {
      setIndexImage(0)
      clearInterval(interval.current)
      interval.current = null
    }
  }

  const handleMouseEnter = () => {
    interval.current = setInterval(() => {
      setIndexImage((prev) =>
        prev === data.pages.about.imageSequence.items.length - 1 ? 0 : prev + 1
      )
    }, 50)

    return cleanup
  }

  return (
    <section className={cn("grid-layout", className)}>
      <h1 className="col-start-1 col-end-5 text-heading uppercase text-brand-w2">
        About Us
      </h1>
      <Image
        alt=""
        src={data.pages.about.imageSequence.items[indexImage].image.url}
        width={data.pages.about.imageSequence.items[indexImage].image.width}
        height={data.pages.about.imageSequence.items[indexImage].image.height}
        className="col-start-5 col-end-7"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={cleanup}
      />
      <div className="col-start-9 col-end-12 text-paragraph text-brand-w2">
        <RichText content={data.pages.about.intro.json.content} />
      </div>
    </section>
  )
}
