"use client"

import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

import { cn } from "@/utils/cn"

interface GalleryFilterProps {
  mode: "grid" | "rows"
  viewMode: "grid" | "rows"
  setViewMode: (mode: "grid" | "rows") => void
}

const GridIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    fill="none"
    className="size-4"
  >
    <rect x="1" y="2" width="10" height="3" fill="#666666" />
    <rect x="1" y="7" width="4" height="3" fill="#666666" />
    <rect x="7" y="7" width="4" height="3" fill="#666666" />
  </svg>
)

const RowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    fill="none"
    className="size-4"
  >
    <rect x="1" y="2" width="10" height="3" fill="#E6E6E6" />
    <rect x="1" y="7" width="10" height="3" fill="#E6E6E6" />
  </svg>
)

export function GalleryFilter({
  mode,
  viewMode,
  setViewMode
}: GalleryFilterProps) {
  return (
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
}
