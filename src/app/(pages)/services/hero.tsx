"use client"

import { RichText } from "basehub/react-rich-text"
import Image from "next/image"
import { useRef, useState } from "react"

import { cn } from "@/utils/cn"

import { QueryType } from "./query"

interface HeroProps {
  data: QueryType
  className?: string
}

export const Hero = ({ data, className }: HeroProps) => {
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
        prev === data.pages.services.imageSequence.items.length - 1
          ? 0
          : prev + 1
      )
    }, 50)

    return cleanup
  }

  return (
    <section className={cn("grid-layout", className)}>
      <h1 className="col-start-1 col-end-6 text-h1 text-brand-w2">Services</h1>
      <Image
        alt=""
        src={data.pages.services.imageSequence.items[indexImage].image.url}
        width={data.pages.services.imageSequence.items[indexImage].image.width}
        height={
          data.pages.services.imageSequence.items[indexImage].image.height
        }
        className="col-start-6 col-end-8"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={cleanup}
      />
      <div className="col-start-9 col-end-12 flex flex-col gap-4 text-h4 text-brand-w2">
        <RichText content={data.pages.services.intro.json.content} />
      </div>
    </section>
  )
}
