"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { cn } from "@/utils/cn"

const segmentClass =
  "px-3 py-1.5 uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-o rounded-full"
const inactiveClass = "text-brand-g1 transition-colors hover:text-brand-o"

/**
 * Sitewide "Human / Machine" switch fixed to the bottom of the viewport
 * (parallel.ai-style). `mode` is decided by the layout that mounts it — the
 * `(site)` tree renders the human mode, `/ai` renders the machine mode — so
 * the active state is server-driven and needs no pathname reads or store.
 *
 * Plain `next/link` on purpose: the primitives Link routes through the canvas
 * scene-transition system, which doesn't exist in the `/ai` tree.
 */
export const ModeToggle = ({ mode }: { mode: "human" | "machine" }) => {
  const router = useRouter()

  const handleBackToHuman = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const referrer = document.referrer
    if (
      referrer.startsWith(window.location.origin) &&
      new URL(referrer).pathname !== "/ai"
    ) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <nav
      aria-label="Site mode"
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-navbar flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto flex animate-slide-up items-center rounded-full border border-brand-g2 bg-brand-k font-mono text-f-p-mobile text-brand-w1 lg:text-f-p">
        {mode === "human" ? (
          <span aria-current="page" className={segmentClass}>
            Human
          </span>
        ) : (
          // Real anchor so it works (and is crawlable) without JS; JS upgrades
          // it to "return to the human page you came from".
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
          <Link href="/ai" className={cn(segmentClass, inactiveClass)}>
            Machine
          </Link>
        )}
      </div>
    </nav>
  )
}
