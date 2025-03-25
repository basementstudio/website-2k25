"use client"

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform
} from "motion/react"
import { useEffect, useMemo } from "react"

import { useCurrentScene } from "@/hooks/use-current-scene"

import { ArrowDownIcon } from "../icons/icons"
import { useInspectable } from "../inspectables/context"
import { useAppLoadingStore } from "../loading/app-loading-handler"

export const ScrollDown = () => {
  const scene = useCurrentScene()
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const { selected } = useInspectable()
  const is404 = scene === "404"
  const isArcade = scene === "lab"
  const isBasketball = scene === "basketball"
  const shouldIgnore = is404 || isArcade || isBasketball

  const scrollY = useMotionValue(0)
  const opacity = useTransform(scrollY, [0, 50], [1, 0])
  const visibility = useTransform(opacity, [0, 1], ["hidden", "visible"])

  const animationProps = useMemo(
    () => ({
      initial: { opacity: 0, scale: 0 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0 },
      transition: { duration: 0.2 }
    }),
    []
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleScroll = () => {
      scrollY.set(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [scrollY])

  const handleClick = () => {
    const mainElement = document.querySelector("main")
    if (mainElement) {
      mainElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (shouldIgnore) return null

  return (
    <AnimatePresence>
      {canRunMainApp && (
        <motion.div
          className="absolute -top-[3rem] hidden w-full justify-center pb-20 lg:left-1/2 lg:flex lg:w-max lg:-translate-x-1/2 lg:pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 1, 0, 1] }}
          transition={{ duration: 0.3, delay: 1.5 }}
        >
          {selected === null && (
            <motion.button
              onClick={handleClick}
              className="-mx-4 -my-2 px-4 py-2"
              style={{
                opacity,
                visibility
              }}
              {...animationProps}
            >
              <span className="user-select-none flex h-max w-fit items-center gap-x-2 bg-brand-k px-1.5 py-0.5 text-f-p-mobile text-brand-w1 lg:text-f-p">
                Scroll to Explore <ArrowDownIcon className="size-2.5" />
              </span>
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
