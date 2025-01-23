"use client"

import { motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { formatDate } from "@/utils/format-date"

import { QueryType } from "./query"

export const Awards = ({ data }: { data: QueryType }) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mouseY, setMouseY] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLUListElement>) => {
    const position = {
      x: e.pageX,
      y: e.pageY
    }

    const offset = {
      left: e.currentTarget.offsetLeft,
      top: e.currentTarget.offsetTop,
      width: e.currentTarget.clientWidth,
      height: e.currentTarget.clientHeight
    }

    const reference = e.currentTarget.offsetParent as HTMLElement
    if (reference) offset.top += reference.offsetTop

    // 156.5 is the half of the height of the certificate
    setMouseY(position.y - offset.top - 156.5)
  }

  return (
    <div className="grid-layout">
      <div className="col-span-12 flex gap-2 text-h2 text-brand-g1">
        <h2>Awards</h2>
        <p>x{data.company.awards.awardList.items.length}</p>
      </div>
      <ul
        className="relative col-span-12 text-paragraph text-brand-w1"
        onMouseMove={handleMouseMove}
      >
        {data.company.awards.awardList.items
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((award) => (
            <li
              key={award._id}
              className="group relative grid grid-cols-12 gap-2 [&:first-child>.item]:after:absolute [&:first-child>.item]:after:-top-px [&:first-child>.item]:after:left-0 [&:first-child>.item]:after:w-full [&:first-child>.item]:after:border-t [&:first-child>.item]:after:border-brand-w1/20"
              onMouseEnter={() => setHoveredItem(award._id)}
              onMouseLeave={() => setHoveredItem(null)}
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
                  className="absolute right-16"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: hoveredItem === award._id ? 1 : 0,
                    y: mouseY
                  }}
                  transition={{ duration: 0.3, type: "spring" }}
                >
                  <Image
                    src={award.certificate.url}
                    alt={award.certificate.alt ?? ""}
                    width={award.certificate.width}
                    height={award.certificate.height}
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
