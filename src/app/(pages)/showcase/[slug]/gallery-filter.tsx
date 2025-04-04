"use client"

import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

import { cn } from "@/utils/cn"

import { useProjectContext } from "./context"

interface GalleryFilterProps {
  mode: "grid" | "rows"
  viewMode: "grid" | "rows" | undefined
  setViewMode: (mode: "grid" | "rows") => void
}

const GridIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    fill="none"
    className="size-3"
  >
    <rect x="1" y="2" width="10" height="3" fill="currentColor" />
    <rect x="1" y="7" width="4" height="3" fill="currentColor" />
    <rect x="7" y="7" width="4" height="3" fill="currentColor" />
  </svg>
)

const RowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    fill="none"
    className="size-3"
  >
    <rect x="1" y="2" width="10" height="3" fill="currentColor" />
    <rect x="1" y="7" width="10" height="3" fill="currentColor" />
  </svg>
)

export const GalleryFilter = ({
  mode,
  viewMode,
  setViewMode
}: GalleryFilterProps) => (
  <CheckboxPrimitive.Root
    className={cn(
      "flex cursor-pointer items-center justify-center gap-1 transition-colors duration-300",
      viewMode === mode ? "text-brand-w1" : "text-brand-g1"
    )}
    value={mode}
    checked={viewMode === mode}
    onCheckedChange={() => setViewMode(mode)}
  >
    {mode === "grid" ? <GridIcon /> : <RowIcon />}
    <span className={cn("sr-only")}>
      {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </span>
  </CheckboxPrimitive.Root>
)

export const Filters = () => {
  const { viewMode, setViewMode } = useProjectContext()

  return (
    <div className="hidden items-center gap-1 lg:flex">
      <GalleryFilter
        mode="grid"
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <GalleryFilter
        mode="rows"
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </div>
  )
}
