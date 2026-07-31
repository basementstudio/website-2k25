"use client"

import { useEffect, useState } from "react"

import { cn } from "@/utils/cn"

const segmentClass =
  "px-3 py-1.5 uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-o rounded-full"
const inactiveClass = "text-brand-g1 transition-colors hover:text-brand-o"

// Fade the pill out when the viewport is within this distance of the page
// bottom, so it doesn't sit on top of the footer.
const BOTTOM_THRESHOLD = 120

/**
 * Sitewide "Human / Machine" switch fixed to the bottom of the viewport
 * (parallel.ai-style). `mode` is decided by the layout that mounts it — the
 * `(site)` tree renders the human mode, `/ai` renders the machine mode — so
 * the active state is server-driven and needs no pathname reads or store.
 *
 * Both directions are plain anchors — full document navigations, never SPA.
 * The WebGL canvas tree can't survive being unmounted and remounted by a
 * client-side route change across the `(site)` boundary (it comes back as a
 * black screen); a real navigation restores the human page from bfcache with
 * the canvas alive, or boots it fresh.
 */
export const ModeToggle = ({ mode }: { mode: "human" | "machine" }) => {
  const [atBottom, setAtBottom] = useState(false)

  // The machine view keeps the pill always visible — no bottom fade.
  const fadeEnabled = mode === "human"

  useEffect(() => {
    if (!fadeEnabled) return
    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight >
        window.innerHeight + BOTTOM_THRESHOLD
      setAtBottom(
        scrollable &&
          window.innerHeight + window.scrollY >=
            document.documentElement.scrollHeight - BOTTOM_THRESHOLD
      )
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [fadeEnabled])

  const handleBackToHuman = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const referrer = document.referrer
    if (
      referrer.startsWith(window.location.origin) &&
      new URL(referrer).pathname !== "/ai"
    ) {
      // Cross-document back: returns to the human page the visitor came from.
      e.preventDefault()
      window.history.back()
    }
    // Otherwise fall through to the anchor's full navigation to "/".
  }

  return (
    <nav
      aria-label="Site mode"
      className={cn(
        "pointer-events-none fixed bottom-0 left-0 right-0 z-navbar flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-300",
        atBottom && "opacity-0"
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center rounded-full border border-brand-g2 bg-brand-k font-mono text-f-p-mobile text-brand-w1 lg:text-f-p",
          atBottom && "pointer-events-none"
        )}
      >
        {mode === "human" ? (
          <span aria-current="page" className={segmentClass}>
            Human
          </span>
        ) : (
          <a
            href="/"
            onClick={handleBackToHuman}
            className={cn(segmentClass, inactiveClass)}
          >
            Human
          </a>
        )}
        {mode === "machine" ? (
          <span aria-current="page" className={segmentClass}>
            Machine
          </span>
        ) : (
          <a href="/ai" className={cn(segmentClass, inactiveClass)}>
            Machine
          </a>
        )}
      </div>
    </nav>
  )
}
