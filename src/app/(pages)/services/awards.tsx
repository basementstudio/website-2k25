"use client"

import { motion } from "motion/react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

import { Link } from "@/components/primitives/link"
import { useDebounce } from "@/hooks/use-debounce"
import { useMedia } from "@/hooks/use-media"
import useMousePosition from "@/hooks/use-mouse-pos"
import { easeInOutCubic } from "@/utils/animations"
import { formatDate } from "@/utils/format-date"

import { QueryType } from "./query"

const IMAGE_HEIGHT = 307.73

export const Awards = ({ data }: { data: QueryType }) => {
  const isDesktop = useMedia("(min-width: 1024px)")
  const mousePosition = useMousePosition()
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null)
  const [translateY, setTranslateY] = useState(0)
  const positionRef = useRef({ x: 0, y: 0 })
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const certificateWidth = 232
  const certificateHeight = 307.73

  const debouncedMousePosition = useDebounce(mousePosition, 150)
  const debouncedHoveredItemId = useDebounce(hoveredItemId, 200)

  const sortedAwards = data.company.awards.awardList.items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((award, index) => ({
      ...award,
      numericId: index + 1
    }))

  const handleMouseEnter = useCallback((id: number) => {
    setHoveredItemId(id)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredItemId(null)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (debouncedHoveredItemId === null) {
      return
    }

    const awardsWithCertificates = sortedAwards.filter(
      (award) => award.certificate
    )
    const hoveredIndex = awardsWithCertificates.findIndex(
      (award) => award.numericId === debouncedHoveredItemId
    )

    if (hoveredIndex !== -1) {
      setTranslateY(-hoveredIndex * IMAGE_HEIGHT)
    }
  }, [debouncedHoveredItemId, sortedAwards])

  useEffect(() => {
    if (debouncedHoveredItemId === null) {
      return
    }

    const mouseX = debouncedMousePosition.x || 0
    const mouseY = debouncedMousePosition.y || 0

    const halfScreenWidth = windowSize.width / 2
    let boundedX = Math.max(mouseX, halfScreenWidth)

    boundedX = Math.min(boundedX, windowSize.width - certificateWidth - 16)

    const boundedY = Math.max(
      0,
      Math.min(mouseY, windowSize.height - certificateHeight)
    )

    positionRef.current = { x: boundedX, y: boundedY }
  }, [
    debouncedMousePosition,
    debouncedHoveredItemId,
    windowSize,
    certificateWidth,
    certificateHeight
  ])

  return (
    <div className="grid-layout">
      <div className="col-span-full flex gap-2 text-mobile-h2 text-brand-g1 lg:text-h2">
        <h2>Awards</h2>
        <p>x{data.company.awards.awardList.items.length}</p>
      </div>
      <div className="relative col-span-full">
        <ul className="text-paragraph col-span-full text-brand-w1">
          {sortedAwards.map((award) => (
            <li
              key={award._id}
              onMouseEnter={() => handleMouseEnter(award.numericId)}
              onMouseLeave={handleMouseLeave}
              className="group relative grid grid-cols-12 gap-2 [&:first-child>.item]:after:absolute [&:first-child>.item]:after:-top-px [&:first-child>.item]:after:left-0 [&:first-child>.item]:after:w-full [&:first-child>.item]:after:border-t [&:first-child>.item]:after:border-brand-w1/20"
            >
              <Link
                href={award.awardUrl ?? ""}
                className="item relative col-span-12 grid grid-cols-12 items-center gap-2 border-b border-brand-w1/20 pb-1 pt-0.75"
              >
                <span className="col-span-6 text-mobile-p lg:col-span-3 lg:text-h4">
                  {award.title}
                </span>
                <span className="col-start-7 col-end-10 text-mobile-p text-brand-w2 lg:col-span-2 lg:text-p">
                  {award.project?._title}
                </span>
                <span className="col-start-10 col-end-13 text-right text-mobile-p text-brand-w2 lg:col-span-2 lg:text-left lg:text-p">
                  {formatDate(award.date, false, "UTC")}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {isDesktop && (
          <motion.div
            animate={{
              top: positionRef.current.y,
              left: positionRef.current.x + 16
            }}
            transition={{
              duration: 1.25,
              ease: easeInOutCubic
            }}
            className="pointer-events-none fixed z-50 grid h-[307.73px] w-[232px] grid-cols-1 overflow-hidden"
          >
            <motion.div
              className="flex flex-col"
              animate={{
                y: translateY
              }}
              transition={{
                duration: 0.8,
                ease: easeInOutCubic
              }}
            >
              {sortedAwards
                .filter((award) => award.certificate)
                .map((award) => (
                  <Image
                    key={award._id}
                    src={award.certificate?.url || ""}
                    alt={award.certificate?.alt ?? ""}
                    width={award.certificate?.width}
                    height={award.certificate?.height}
                    className="max-h-[307.73px] w-full object-cover"
                    data-numeric-id={award.numericId}
                  />
                ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
