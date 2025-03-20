"use client"

import throttle from "lodash.throttle"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants
} from "motion/react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Link } from "@/components/primitives/link"
import { useMedia } from "@/hooks/use-media"
import useMousePosition from "@/hooks/use-mouse-pos"
import { cn } from "@/utils/cn"
import { formatDate } from "@/utils/format-date"

import type { QueryType } from "./query"

const IMAGE_HEIGHT = 307.73
const GRID_COLS = 6
const GRID_ROWS = 8

// Optimized hook for mouse position with throttling
const useThrottledMousePosition = (delay = 16) => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const { x, y } = useMousePosition()

  // Update positions with throttling
  const updateMousePosition = useMemo(
    () =>
      throttle((newX: number, newY: number) => {
        mouseX.set(newX)
        mouseY.set(newY)
      }, delay),
    [mouseX, mouseY, delay]
  )

  useEffect(() => {
    if (x !== null && y !== null) {
      updateMousePosition(x, y)
    }
  }, [x, y, updateMousePosition])

  return { mouseX, mouseY }
}

export const Awards = ({ data }: { data: QueryType }) => {
  const isDesktop = useMedia("(min-width: 1024px)")
  const sectionRef = useRef<HTMLDivElement>(null)
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null)
  const [translateY, setTranslateY] = useState(0)
  const [currentImageId, setCurrentImageId] = useState<number | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)

  // Use the throttled version for better performance
  const { mouseX, mouseY } = useThrottledMousePosition()

  // Transform position values directly
  const rawCertificateX = useTransform(mouseX, (x) => x - 232 / 2)
  const rawCertificateY = useTransform(mouseY, (y) => y - 308 / 2)

  // Add spring effect for natural movement
  const certificateX = useSpring(rawCertificateX, {
    stiffness: 1000,
    damping: 50,
    mass: 0.05
  })

  const certificateY = useSpring(rawCertificateY, {
    stiffness: 1000,
    damping: 50,
    mass: 0.05
  })

  const certificateDimensions = { width: 232, height: 307.73 }

  const sortedAwards = useMemo(
    () =>
      data.company.awards.awardList.items
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((award, index) => ({
          ...award,
          numericId: index + 1
        })),
    [data.company.awards.awardList.items]
  )

  const gridCells = useMemo(() => {
    const cells = []
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const index = row * GRID_COLS + col
        const manhattanDistance = row + col
        cells.push({ row, col, index, manhattanDistance })
      }
    }
    return cells
  }, [])

  const handleMouseEnter = useCallback((id: number) => {
    setHoveredItemId(id)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredItemId(null)
  }, [])

  const handleRevealEnter = useCallback(() => {
    setIsRevealing(true)
  }, [])

  const handleRevealLeave = useCallback(() => {
    setIsRevealing(false)
    setHoveredItemId(null)
  }, [])

  useEffect(() => {
    if (hoveredItemId === null) {
      return
    }

    const awardsWithCertificates = sortedAwards.filter(
      (award) => award.certificate
    )
    const hoveredIndex = awardsWithCertificates.findIndex(
      (award) => award.numericId === hoveredItemId
    )

    if (hoveredIndex !== -1) {
      if (hoveredItemId !== currentImageId) {
        setCurrentImageId(hoveredItemId)
      }

      const newTranslateY = -hoveredIndex * IMAGE_HEIGHT
      if (newTranslateY !== translateY) {
        setTranslateY(newTranslateY)
      }
    }
  }, [hoveredItemId, sortedAwards, translateY, currentImageId])

  // cell animation
  const cellVariants: Variants = {
    hidden: {
      scale: 0.95,
      opacity: 0
    },
    visible: ({ manhattanDistance }: { manhattanDistance: number }) => {
      const maxDistance = GRID_ROWS - 1 + (GRID_COLS - 1)
      const normalizedDistance = manhattanDistance / maxDistance

      return {
        scale: 1,
        opacity: 1,
        transition: {
          duration: 0.7,
          delay: normalizedDistance * 0.15,
          ease: [0.16, 1, 0.3, 1],
          type: "keyframes"
        }
      }
    },
    exit: ({ manhattanDistance }: { manhattanDistance: number }) => {
      const maxDistance = GRID_ROWS - 1 + (GRID_COLS - 1)
      const normalizedDistance = manhattanDistance / maxDistance

      return {
        scale: 0,
        opacity: 0,
        willChange: "transform, opacity",
        transition: {
          duration: 0.7,
          delay: (1 - normalizedDistance) * 0.15,
          ease: [0.16, 1, 0.3, 1],
          type: "keyframes"
        }
      }
    }
  }

  return (
    <>
      <div className="grid-layout" ref={sectionRef}>
        <div className="col-span-full flex gap-2 text-mobile-h2 text-brand-g1 lg:text-h2">
          <h2>Awards</h2>
          <p>x{data.company.awards.awardList.items.length}</p>
        </div>
        <div className="col-span-full">
          <ul
            onMouseEnter={handleRevealEnter}
            onMouseLeave={handleRevealLeave}
            className="text-paragraph col-span-full text-brand-w1"
          >
            {sortedAwards.map((award) => (
              <li
                key={award._id}
                onMouseEnter={() => handleMouseEnter(award.numericId)}
                onMouseLeave={handleMouseLeave}
                className="group relative grid grid-cols-12 gap-2 [&:first-child>.item]:after:absolute [&:first-child>.item]:after:-top-px [&:first-child>.item]:after:left-0 [&:first-child>.item]:after:w-full [&:first-child>.item]:after:border-t [&:first-child>.item]:after:border-brand-w1/20"
              >
                <div className="item relative col-span-12 grid grid-cols-12 items-center gap-2 border-b border-brand-w1/20 pb-1 pt-0.75">
                  <span className="col-span-6 line-clamp-1 text-mobile-p lg:col-span-3 lg:!text-[1rem] lg:text-h4">
                    {award.title}
                  </span>
                  <span className="col-start-7 col-end-10 line-clamp-1 text-mobile-p text-brand-w2 lg:col-span-3 lg:!text-[1rem] lg:text-p">
                    {award.project?._title ?? award.projectFallback}
                  </span>
                  <span className="col-span-3 text-right text-mobile-p text-brand-w2 lg:col-span-2 lg:col-start-11 lg:!text-[1rem] lg:text-p">
                    {formatDate(
                      award.date,
                      false,
                      "UTC",
                      isDesktop ? false : true
                    )}
                  </span>
                </div>
                <div className="with-diagonal-lines pointer-events-none !absolute -top-px bottom-0 left-0 right-0 opacity-0 transition-opacity duration-0 group-hover:opacity-100" />
              </li>
            ))}
          </ul>
        </div>
      </div>
      {isDesktop && (
        <motion.div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 100,
            display: "flex",
            width: 232,
            height: 308,
            overflow: "hidden",
            pointerEvents: "none",
            x: certificateX,
            y: certificateY,
            willChange: "transform"
          }}
        >
          {/* SVG Mask for grid reveal */}
          <svg
            width="0"
            height="0"
            className="absolute"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <clipPath id="grid-mask">
                <AnimatePresence mode="wait" initial={false}>
                  {isRevealing ? (
                    <>
                      {gridCells.map((cell) => (
                        <motion.rect
                          key={cell.index}
                          custom={{
                            manhattanDistance: cell.manhattanDistance
                          }}
                          variants={cellVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          x={
                            cell.col *
                              (certificateDimensions.width / GRID_COLS) -
                            0.5
                          }
                          y={
                            cell.row *
                              (certificateDimensions.height / GRID_ROWS) -
                            0.5
                          }
                          width={certificateDimensions.width / GRID_COLS + 1}
                          height={certificateDimensions.height / GRID_ROWS + 1}
                        />
                      ))}
                      <motion.rect
                        key="full-mask"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{
                          opacity: 0,
                          transition: { duration: 0.1, delay: 0 }
                        }}
                        transition={{ delay: 0.4, duration: 0.1 }}
                        x="-1"
                        y="-1"
                        width={certificateDimensions.width + 2}
                        height={certificateDimensions.height + 2}
                        fill="white"
                      />
                    </>
                  ) : null}
                </AnimatePresence>
              </clipPath>
            </defs>
          </svg>

          <div
            className="h-full w-full overflow-hidden"
            style={{
              clipPath: "url(#grid-mask)"
            }}
          >
            {sortedAwards
              .filter((award) => award.certificate)
              .map((award) => (
                <div key={award._id} className="h-full w-full">
                  <Image
                    src={award.certificate?.url || ""}
                    alt={award.certificate?.alt ?? ""}
                    fill
                    className={cn("max-h-[307.73px] w-full object-cover", {
                      hidden: award.numericId !== currentImageId
                    })}
                    data-numeric-id={award.numericId}
                    priority={true}
                  />
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </>
  )
}
