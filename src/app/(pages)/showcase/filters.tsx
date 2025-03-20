import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { memo, useCallback } from "react"

import { cn } from "@/utils/cn"

import { CategoryItem } from "./showcase-list/client"

const GridIcon = () => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    className="size-3"
  >
    <path d="M2 2h5v5H2zM7 7h3v3H7z" />
  </svg>
)

const RowIcon = () => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 12 12"
    className="size-3"
  >
    <path d="M1 4h10v1H1zM1 7h10v1H1z" />
  </svg>
)

interface ViewSelectorProps {
  mode: "grid" | "rows"
  viewMode: "grid" | "rows"
  setViewMode: (mode: "grid" | "rows") => void
}

const ViewSelector = memo(
  ({ mode, viewMode, setViewMode }: ViewSelectorProps) => (
    <CheckboxPrimitive.Root
      className={cn(
        "h-4",
        viewMode === mode
          ? "cursor-default text-brand-w1"
          : "cursor-pointer text-brand-g1"
      )}
      value={mode}
      checked={viewMode === mode}
      onCheckedChange={() => {
        setViewMode(mode)
      }}
    >
      <span
        className={cn("!flex items-center justify-center gap-1", {
          ["underline"]: viewMode === mode,
          ["actionable actionable-no-underline"]: viewMode !== mode
        })}
      >
        {mode === "grid" ? <GridIcon /> : <RowIcon />}
        <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
      </span>
    </CheckboxPrimitive.Root>
  )
)
ViewSelector.displayName = "ViewSelector"

interface FiltersProps {
  categories: CategoryItem[]
  selectedCategory: string | null
  viewMode: "grid" | "rows"
  setViewMode: (mode: "grid" | "rows") => void
  setSelectedCategory: (category: string | null) => void
}

export const Filters = memo(
  ({
    categories,
    selectedCategory,
    setSelectedCategory,
    viewMode,
    setViewMode
  }: FiltersProps) => {
    const categoryHandler = useCallback(
      (category: string) => {
        setSelectedCategory(selectedCategory === category ? null : category)
      },
      [selectedCategory, setSelectedCategory]
    )

    return (
      <div className="grid-layout items-end pb-2">
        <div className="text-f-p col-span-1 hidden items-center gap-1 text-brand-g1 lg:flex">
          <ViewSelector
            mode="grid"
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          <span className="text-brand-g1">,</span>
          <ViewSelector
            mode="rows"
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>

        <div className="col-span-3 flex flex-col gap-2 lg:col-start-7 lg:col-end-13">
          <p className="text-f-p-mobile lg:text-f-h3 text-brand-g1">
            Categories
          </p>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {categories.map((category) => (
              <button
                key={category.name}
                className={cn(
                  "!text-f-h2-mobile lg:!text-f-h2 flex w-max items-center gap-x-1.25 text-left text-brand-g1 transition-colors duration-300",
                  selectedCategory === category.name && "text-brand-w1",
                  // if no categories selected, show all as active
                  selectedCategory === null && "text-brand-w1"
                )}
                onClick={() => categoryHandler(category.name)}
              >
                <span className="actionable">{category.name}</span>
              </button>
            ))}
          </ul>
        </div>
      </div>
    )
  }
)
Filters.displayName = "Filters"
