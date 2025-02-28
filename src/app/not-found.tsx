"use client"

import { useEffect, useState } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"

export default function NotFound() {
  const { handleNavigation } = useHandleNavigation()
  const currentScene = useNavigationStore((state) => state.currentScene)
  const [formattedTime, setFormattedTime] = useState("00:00:00:00")

  useEffect(() => {
    const updateTime = () => {
      const time = new Date()
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        })
        .replace(/:/g, ":")
      setFormattedTime(`00:${time}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  if (currentScene?.name !== "404") return null

  return (
    <>
      <div className="fixed top-9 z-30 grid h-[calc(100dvh-36px)] w-full place-items-center">
        <div className="relative grid aspect-[4/3] h-full max-h-[768px] w-full max-w-[1024px] place-items-center p-14">
          <div className="absolute left-0 top-0">
            <div className="h-[60px] w-[2px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
            <div className="absolute top-0 h-[2px] w-[60px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
          </div>

          <div className="absolute right-0 top-0">
            <div className="h-[60px] w-[2px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
            <div className="absolute right-0 top-0 h-[2px] w-[60px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
          </div>

          <div className="absolute bottom-0 left-0">
            <div className="h-[60px] w-[2px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
            <div className="absolute bottom-0 h-[2px] w-[60px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
          </div>

          <div className="absolute bottom-0 right-0">
            <div className="h-[60px] w-[2px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
            <div className="absolute bottom-0 right-0 h-[2px] w-[60px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
          </div>

          <div className="relative grid h-full w-full place-items-center font-mono text-[1.375rem] uppercase text-white">
            <span className="absolute left-0 top-0">error - 404</span>

            <div className="absolute bottom-0 left-0 flex items-center gap-2">
              <div className="size-2 animate-pulse rounded-full bg-brand-r" />
              <span>rec</span>
            </div>

            <span className="absolute right-0 top-0">security cam 4870</span>
            <span className="absolute bottom-0 right-0">{formattedTime}</span>

            <button
              onClick={() => handleNavigation("/")}
              className="uppercase underline"
            >
              <span>go back home</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
