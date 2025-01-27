"use client"

import { motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import { MouseEvent, useState } from "react"

import { formatDate } from "@/utils/format-date"

import { QueryType } from "./query"

export const Awards = ({ data }: { data: QueryType }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mouseY, setMouseY] = useState(0)
  const [hoveredHeight, setHoveredHeight] = useState(0)

  function getRelativeCoordinates(
    event: MouseEvent<HTMLElement>,
    ref: HTMLElement
  ) {
    const position = {
      y: event.pageY
    }

    const offset = {
      top: ref.offsetTop,
      height: ref.clientHeight
    }

    let reference = ref.offsetParent as HTMLElement

    while (reference) {
      offset.top += reference.offsetTop
      reference = reference.offsetParent as HTMLElement
    }

    return {
      centerY:
        (position.y - offset.top - offset.height / 2) / (offset.height / 2)
    }
  }

  return (
    <div className="grid-layout">
      <div className="col-span-12 flex gap-2 text-h2 text-brand-g1">
        <h2>Awards</h2>
        <p>x{data.company.awards.awardList.items.length}</p>
      </div>
      <ul
        className="relative col-span-12 text-paragraph text-brand-w1"
        onMouseMove={(e) => {
          const coordinates = getRelativeCoordinates(
            e,
            e.currentTarget as HTMLElement
          )
          setMouseY(coordinates.centerY)
        }}
      >
        {data.company.awards.awardList.items
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((award) => (
            <li
              key={award._id}
              className="group relative grid grid-cols-12 gap-2 [&:first-child>.item]:after:absolute [&:first-child>.item]:after:-top-px [&:first-child>.item]:after:left-0 [&:first-child>.item]:after:w-full [&:first-child>.item]:after:border-t [&:first-child>.item]:after:border-brand-w1/20"
              onMouseEnter={() => {
                setHoveredItem(award._id)
                setHoveredHeight(award.certificate?.height ?? 0)
              }}
              onMouseLeave={() => {
                setHoveredItem(null)
                setHoveredHeight(0)
              }}
            >
              <Link
                href={award.awardUrl ?? ""}
                className="item relative col-span-12 grid grid-cols-4 gap-2 border-b border-brand-w1/20 pb-1 pt-0.75"
              >
                <span className="col-span-1 text-h4">{award.title}</span>
                <span className="col-span-1 text-p text-brand-w2">
                  {award.project._title}
                </span>
                <span className="col-span-1 text-p text-brand-w2">
                  {formatDate(award.date)}
                </span>
              </Link>

              {award.certificate ? (
                <motion.div
                  className="absolute right-16 h-[313px] w-[232px] opacity-0"
                  animate={{
                    opacity: hoveredItem === award._id ? 1 : 0,
                    y: mouseY - hoveredHeight / 2
                  }}
                  transition={{ duration: 0.4, type: "spring" }}
                >
                  <Image
                    src={award.certificate.url}
                    alt={award.certificate.alt ?? ""}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              ) : null}

              <div className="with-diagonal-lines pointer-events-none !absolute -top-px bottom-0 left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </li>
          ))}
      </ul>
    </div>
  )
}
