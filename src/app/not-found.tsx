"use client"

import { useEffect, useState } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { cn } from "@/utils/cn"

export default function NotFound() {
  const { handleNavigation } = useHandleNavigation()
  const currentScene = useNavigationStore((state) => state.currentScene)
  const [formattedTime, setFormattedTime] = useState("00:00:00:00")
  const [fadeOutHtml, setFadeOutHtml] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const time = new Date()
        .toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Argentina/Buenos_Aires"
        })
        .replace(/:/g, ":")
      setFormattedTime(`00:${time}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  const goBack = () => {
    setFadeOutHtml(true)

    setTimeout(() => {
      handleNavigation("/")
    }, 500)
  }

  if (currentScene?.name !== "404") return null

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 mx-auto grid h-full w-full max-w-full place-items-center p-6 lg:p-18",
          fadeOutHtml
            ? "opacity-0 transition-opacity duration-500"
            : "[animation:fade-in_1500ms_ease-in-out_1_normal_none_running]"
        )}
      >
        <div className="relative mx-auto grid h-full w-full place-items-center p-4 lg:p-12">
          <div className="absolute left-0 top-0">
            <div className="h-7 w-0.5 bg-brand-w1 shadow-[0_0_10px_#fff,0_0_20px_#fff] lg:h-14" />
            <div className="absolute top-0 h-0.5 w-7 bg-brand-w1 shadow-[0_0_10px_#fff,0_0_20px_#fff] lg:w-14" />
          </div>

          <div className="absolute right-0 top-0">
            <div className="h-7 w-0.5 bg-brand-w1 shadow-[0_0_10px_#fff,0_0_20px_#fff] lg:h-14" />
            <div className="absolute right-0 top-0 h-0.5 w-7 bg-brand-w1 shadow-[0_0_10px_#fff,0_0_20px_#fff] lg:w-14" />
          </div>

          <div className="absolute bottom-0 left-0">
            <div className="h-7 w-0.5 bg-brand-w1 shadow-[0_0_10px_#fff,0_0_20px_#fff] lg:h-14" />
            <div className="absolute bottom-0 h-0.5 w-7 bg-brand-w1 shadow-[0_0_10px_#fff,0_0_20px_#fff] lg:w-14" />
          </div>

          <div className="absolute bottom-0 right-0">
            <div className="h-7 w-0.5 bg-brand-w1 shadow-[0_0_10px_#fff,0_0_20px_#fff] lg:h-14" />
            <div className="absolute bottom-0 right-0 h-0.5 w-7 bg-brand-w1 shadow-[0_0_10px_#fff,0_0_20px_#fff] lg:w-14" />
          </div>

          <div className="relative grid h-full w-full place-items-center font-mono text-f-h4-mobile uppercase text-brand-w1 lg:text-f-h4">
            <span className="absolute left-0 top-0 tracking-wider [text-shadow:0_0_10px_#fff]">
              ERROR - 404
            </span>

            <div className="absolute bottom-0 left-0 flex items-center gap-2">
              <div className="size-2 animate-pulse rounded-full bg-brand-r shadow-[0_0_10px_#ff0000]" />
              <span className="font-bold tracking-widest text-brand-w1 [text-shadow:0_0_10px_#fff]">
                REC
              </span>
            </div>

            <span className="absolute right-0 top-0 tracking-wider [text-shadow:0_0_10px_#fff]">
              SECURITY CAM 4870
            </span>
            <span className="absolute bottom-0 right-0 font-bold tracking-[0.2em] text-brand-w1 [text-shadow:0_0_10px_#fff]">
              {formattedTime}
            </span>

            <button
              onClick={() => goBack()}
              className="actionable actionable-no-underline text-f-h3-mobile uppercase tracking-widest text-brand-w1 lg:text-f-h3"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
