"use client"

import { track } from "@vercel/analytics"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@/utils/cn"

const segmentClass =
  "px-3 py-1.5 uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-o rounded-full"

// Fade the pill out when the viewport is within this distance of the page
// bottom, so it doesn't sit on top of the footer.
const BOTTOM_THRESHOLD = 120

// sessionStorage key holding the machine path the current tab entered via the
// toggle, so "Human" can history.back() to the exact page the visitor left —
// but only while still on that entry page (navigating within the machine view
// pushes machine pages onto the history stack, so back() would stay machine).
// `document.referrer` alone is not enough: it goes stale across client-side
// navigations within the human site (it keeps the original external referrer).
const MACHINE_ENTRY_KEY = "bsmt-machine-entry"

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
  const pathname = usePathname() ?? ""

  // Blog posts have a per-page machine mirror (/post/<slug> ↔ /ai/post/<slug>)
  // and the blog index (including category views) mirrors to /ai/blog;
  // everything else toggles against the /ai index.
  const machineHref = pathname.startsWith("/post/")
    ? `/ai${pathname}`
    : pathname === "/blog" || pathname.startsWith("/blog/")
      ? "/ai/blog"
      : "/ai"
  const humanHref = pathname.startsWith("/ai/")
    ? pathname.slice("/ai".length)
    : "/"

  // Machine mode keeps the /ai amber-phosphor border; segment colors follow
  // the navbar convention in both modes — orange marks the active mode,
  // white marks the clickable one.
  const isMachine = mode === "machine"
  const pillClass = isMachine
    ? "border-machine-base/40 bg-machine-bg"
    : "border-brand-g2 bg-brand-k"
  const activeClass = "text-brand-o"
  const inactiveClass = "text-brand-w1 transition-colors hover:text-brand-o"

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

  const handleEnterMachine = () => {
    // Human tree only — the machine view mounts no analytics.
    track("machine_mode_entered", { from: pathname })

    try {
      sessionStorage.setItem(MACHINE_ENTRY_KEY, machineHref)
    } catch {
      // Storage unavailable — "Human" will fall back to the referrer check.
    }
  }

  const handleBackToHuman = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Modified clicks open "/" in a new tab/window — never hijack those.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    let cameFromToggle = false
    try {
      // Only back() while still on the machine page the toggle entered on —
      // after navigating within the machine view, back() would stay machine.
      cameFromToggle =
        sessionStorage.getItem(MACHINE_ENTRY_KEY) === window.location.pathname
      // One-shot: a later direct visit to /ai in this tab must not back() out
      // of the site.
      sessionStorage.removeItem(MACHINE_ENTRY_KEY)
    } catch {
      // Storage unavailable — rely on the referrer fallback below.
    }

    const referrer = document.referrer
    const sameOriginReferrer =
      referrer.startsWith(window.location.origin) &&
      !new URL(referrer).pathname.startsWith("/ai")

    // A tab opened directly onto /ai (new tab via modified click, window.open)
    // can inherit the storage marker and referrer but has no session-history
    // entry to go back to — history.back() would be a silent no-op. Only
    // hijack the anchor when a previous entry actually exists.
    const nav = (window as Window & { navigation?: { canGoBack?: boolean } })
      .navigation
    const canGoBack = nav?.canGoBack ?? window.history.length > 1

    if ((cameFromToggle || sameOriginReferrer) && canGoBack) {
      // Cross-document back: returns to the human page the visitor came from.
      e.preventDefault()
      window.history.back()
    }
    // Otherwise fall through to the anchor's full navigation to the human
    // counterpart of this page.
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
          "pointer-events-auto flex items-center rounded-full border font-mono text-f-p-mobile lg:text-f-p",
          pillClass,
          atBottom && "pointer-events-none"
        )}
      >
        {mode === "human" ? (
          <span aria-current="page" className={cn(segmentClass, activeClass)}>
            Human
          </span>
        ) : (
          <a
            href={humanHref}
            onClick={handleBackToHuman}
            className={cn(segmentClass, inactiveClass)}
          >
            Human
          </a>
        )}
        {mode === "machine" ? (
          <span aria-current="page" className={cn(segmentClass, activeClass)}>
            Machine
          </span>
        ) : (
          <a
            href={machineHref}
            onClick={handleEnterMachine}
            className={cn(segmentClass, inactiveClass)}
          >
            Machine
          </a>
        )}
      </div>
    </nav>
  )
}
