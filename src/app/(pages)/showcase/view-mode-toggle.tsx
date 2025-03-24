"use client"

import { memo, useEffect } from "react"

import { useShowcaseContext } from "./showcase-list/context"

const GridIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 2.5H7.5V7.5H2.5V2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.5 2.5H17.5V7.5H12.5V2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 12.5H7.5V17.5H2.5V12.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.5 12.5H17.5V17.5H12.5V12.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ListIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 5H17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 10H17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 15H17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const ViewModeToggle = memo(() => {
  const { viewMode, setViewMode } = useShowcaseContext()

  useEffect(() => {
    // Sync with URL hash on mount and hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash === "grid" || hash === "rows") {
        setViewMode(hash)
      }
    }

    // Initial sync
    handleHashChange()

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [setViewMode])

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setViewMode("grid")}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === "grid"
            ? "bg-neutral-100 text-neutral-900"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
        aria-label="Grid view"
      >
        <GridIcon />
      </button>
      <button
        onClick={() => setViewMode("rows")}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === "rows"
            ? "bg-neutral-100 text-neutral-900"
            : "text-neutral-500 hover:text-neutral-900"
        }`}
        aria-label="List view"
      >
        <ListIcon />
      </button>
    </div>
  )
})
ViewModeToggle.displayName = "ViewModeToggle" 