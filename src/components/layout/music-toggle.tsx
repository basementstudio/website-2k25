import { animate } from "motion"
import { useEffect, useRef } from "react"

import { cn } from "@/utils/cn"

const MusicToggle = ({
  music,
  visualState = music
}: {
  music: boolean
  visualState?: boolean
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const bars = Array.from(svgRef.current.querySelectorAll("rect"))
    const animations: Array<{ cancel: () => void }> = []

    if (visualState) {
      bars.forEach((bar, index) => {
        const maxHeight = Math.floor(Math.random() * 5) + 8

        const middleY = 7.5 - 1
        const expandedY = 7.5 - maxHeight / 2
        const randomDelay = Math.random() * 0.5

        const heightAnimation = animate(
          // @ts-ignore
          bar.getAttribute("height"),
          [2, maxHeight],
          {
            duration: 0.8,
            delay: randomDelay,
            repeat: Infinity,
            repeatType: "reverse",
            onUpdate: (latest) => {
              bar.setAttribute("height", latest)
            }
          }
        )

        const yAnimation = animate(
          // @ts-ignore
          bar.getAttribute("y"),
          [middleY, expandedY],
          {
            duration: 0.8,
            delay: randomDelay,
            repeat: Infinity,
            repeatType: "reverse",
            // @ts-ignore
            onUpdate: (latest) => {
              bar.setAttribute("y", latest)
            }
          }
        )

        animations.push(heightAnimation)
        animations.push(yAnimation)
      })
    } else {
      bars.forEach((bar) => {
        bar.setAttribute("height", "2")
        bar.setAttribute("y", String(7.5 - 1))
      })
    }

    return () => {
      animations.forEach((animation) => {
        if (animation && typeof animation.cancel === "function") {
          animation.cancel()
        }
      })
    }
  }, [visualState])

  return (
    <span
      className={cn(
        "inline-block w-6 text-left",
        visualState ? "text-brand-w1" : "text-brand-g1"
      )}
    >
      <svg
        ref={svgRef}
        width="22"
        height="15"
        viewBox="0 0 22 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full"
      >
        <rect x="0" y="6.5" width="2" height="2" fill="currentColor" />
        <rect x="5" y="6.5" width="2" height="2" fill="currentColor" />
        <rect x="10" y="6.5" width="2" height="2" fill="currentColor" />
        <rect x="15" y="6.5" width="2" height="2" fill="currentColor" />
        <rect x="20" y="6.5" width="2" height="2" fill="currentColor" />
      </svg>
    </span>
  )
}

export default MusicToggle
