import { Checkbox } from "@/components/primitives/checkbox"

interface FiltersProps {
  categories: string[]
  selectedCategories: string[]
  setSelectedCategories: (categories: string[]) => void
}

export const Filters = ({
  categories,
  selectedCategories,
  setSelectedCategories
}: FiltersProps) => {
  const categoryHandler = (category: string, checked: boolean) => {
    setSelectedCategories(
      checked
        ? [...selectedCategories, category]
        : selectedCategories.filter((c) => c !== category)
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
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
  )
}
