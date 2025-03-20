"use client"

import { motion, useMotionValue, useTransform } from "motion/react"
import { useEffect } from "react"

import { useCurrentScene } from "@/hooks/use-current-scene"

import { ArrowDownIcon } from "../icons/icons"
import { useAppLoadingStore } from "../loading/app-loading-handler"

export const ScrollDown = () => {
  const scene = useCurrentScene()
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const is404 = scene === "404"
  const isArcade = scene === "lab"
  const isBasketball = scene === "basketball"

  const shouldIgnore = is404 || isArcade || isBasketball

  const scrollY = useMotionValue(0)
  const opacity = useTransform(scrollY, [0, 50], [1, 0])

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

  if (shouldIgnore || !canRunMainApp) return null

  return (
    <motion.a
      href="#main-content"
      className="absolute -top-[3.25rem] left-1/2 flex w-fit -translate-x-1/2 items-center gap-x-2 bg-brand-k px-1.5 py-0.5 text-p text-brand-w1"
      style={{
        opacity
      }}
    >
      Scroll to Explore <ArrowDownIcon className="size-2.5" />
    </motion.a>
  )
}
