"use client"

import { AnimatePresence, motion, Variants } from "motion/react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Link } from "@/components/primitives/link"
import { useMedia } from "@/hooks/use-media"
import useMousePosition from "@/hooks/use-mouse-pos"
import { formatDate } from "@/utils/format-date"

import { QueryType } from "./query"

const IMAGE_HEIGHT = 307.73
const GRID_COLS = 8
const GRID_ROWS = 10

export const Awards = ({ data }: { data: QueryType }) => {
  const isDesktop = useMedia("(min-width: 1024px)")
  const sectionRef = useRef<HTMLDivElement>(null)
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null)
  const [translateY, setTranslateY] = useState(0)
  const [currentImageId, setCurrentImageId] = useState<number | null>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const { x, y } = useMousePosition()

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

  // Get all awards with certificates
  const awardsWithCertificates = useMemo(() => {
    return sortedAwards.filter((award) => award.certificate?.url)
  }, [sortedAwards])

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
                <Link
                  href={award.awardUrl ?? ""}
                  className="item relative col-span-12 grid grid-cols-12 items-center gap-2 border-b border-brand-w1/20 pb-1 pt-0.75"
                >
                  <span className="col-span-6 text-mobile-p lg:col-span-3 lg:text-h4">
                    {award.title}
                  </span>
                  <span className="col-start-7 col-end-10 text-mobile-p text-brand-w2 lg:col-span-3 lg:text-p">
                    {award.project?._title}
                  </span>
                  <span className="col-start-10 col-end-13 text-right text-mobile-p text-brand-w2 lg:col-span-2 lg:text-left lg:text-p">
                    {formatDate(award.date, false, "UTC")}
                  </span>
                </Link>
                <div className="with-diagonal-lines pointer-events-none !absolute -top-px bottom-0 left-0 right-0 opacity-0 transition-opacity duration-0 group-hover:opacity-100" />
              </li>
            ))}
          </ul>
        </div>
      </div>
      {isDesktop && (
        <motion.div
          animate={{
            translateX: x! - 232 / 2,
            translateY: y! - 307.73 / 2,
            transition: {
              type: "spring",
              mass: 0.05
            }
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 100,
            display: "flex",
            width: "232px",
            height: "307.73px",
            overflow: "hidden",
            pointerEvents: "none"
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
            {currentImageId &&
              sortedAwards
                .filter(
                  (award) =>
                    award.numericId === currentImageId && award.certificate
                )
                .map((award) => (
                  <div key={award._id} className="h-full w-full">
                    <Image
                      src={award.certificate?.url || ""}
                      alt={award.certificate?.alt ?? ""}
                      width={award.certificate?.width}
                      height={award.certificate?.height}
                      className="max-h-[307.73px] w-full object-cover"
                      data-numeric-id={award.numericId}
                      sizes="232px"
                    />
                  </div>
                ))}
          </div>
        </motion.div>
      )}

      <div
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      >
        {awardsWithCertificates.map((award) => (
          <Image
            key={`preload-${award._id}`}
            src={award.certificate?.url || ""}
            alt=""
            width={232}
            height={award.certificate?.height || 307}
            priority={true}
            sizes="232px"
            quality={90}
            loading="eager"
          />
        ))}
      </div>
    </>
  )
}
