import * as CheckboxPrimitive from "@radix-ui/react-checkbox"

import { Checkbox } from "@/components/primitives/checkbox"
import { cn } from "@/utils/cn"

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

interface FiltersProps {
  categories: string[]
  selectedCategories: string[]
  viewMode: "grid" | "rows"
  setViewMode: (mode: "grid" | "rows") => void
  setSelectedCategories: (categories: string[]) => void
}

interface ViewSelectorProps {
  mode: "grid" | "rows"
  viewMode: "grid" | "rows"
  setViewMode: (mode: "grid" | "rows") => void
}

const ViewSelector = ({ mode, viewMode, setViewMode }: ViewSelectorProps) => (
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
    <span className={cn(viewMode === mode && "actionable")}>
      {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </span>
  </CheckboxPrimitive.Root>
)

export const Filters = ({
  categories,
  selectedCategories,
  setSelectedCategories,
  viewMode,
  setViewMode
}: FiltersProps) => {
  const categoryHandler = (category: string, checked: boolean) => {
    setSelectedCategories(
      checked
        ? [...selectedCategories, category]
        : selectedCategories.filter((c) => c !== category)
    )
  }

  return (
    <div className="grid-layout items-end">
      <div className="col-span-1 flex items-center gap-1 text-paragraph text-brand-g1">
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

      <div className="col-span-2 col-start-6 flex flex-wrap gap-1">
        {categories.map((category) => (
          <Checkbox
            key={category}
            checked={selectedCategories.includes(category)}
            onCheckedChange={(checked) =>
              categoryHandler(category, checked as boolean)
            }
          >
            {category}
          </Checkbox>
        ))}
      </div>
    </div>
  )
}
