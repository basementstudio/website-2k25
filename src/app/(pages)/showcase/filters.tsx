import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { memo, useCallback } from "react"

import { cn } from "@/utils/cn"

import { CategoryItem } from "./project-list"

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
        viewMode === mode
          ? "cursor-default text-brand-w1"
          : "cursor-pointer text-brand-g1"
      )}
      value={mode}
      checked={viewMode === mode}
      onCheckedChange={() => setViewMode(mode)}
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
        <div className="col-span-1 hidden items-center gap-1 text-p text-brand-g1 lg:flex">
          <ViewSelector
            mode="grid"
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          {" , "}
          <ViewSelector
            mode="rows"
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>

        <div className="col-span-3 flex flex-col gap-2 lg:col-start-7 lg:col-end-13">
          <p className="text-p text-brand-g1">Filters</p>

          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {categories.map((category) => (
              <button
                key={category.name}
                className={cn(
                  "flex w-max gap-x-1.25 text-left !text-mobile-h2 text-brand-g1 transition-colors duration-300 lg:!text-h2",
                  selectedCategory === category.name && "text-brand-w1",
                  // if no categories selected, show all as active
                  selectedCategory === null && "text-brand-w1"
                )}
                onClick={() => categoryHandler(category.name)}
              >
                <span className="actionable">{category.name}</span>
                {category.count && (
                  <sup className="translate-y-1.5 text-p !font-semibold text-brand-g1">
                    ({category.count})
                  </sup>
                )}
              </button>
            ))}
          </ul>
        </div>
      </div>
    )
  }
)
Filters.displayName = "Filters"
