import { cn } from "@/utils/cn"

interface CategoriesProps {
  categories: string[]
  className?: string
}

export const Categories = ({ categories, className }: CategoriesProps) => (
  <div className={cn("flex gap-1", className)}>
    {categories.map((c) => (
      <div
        key={c}
        className="h-4 w-fit bg-brand-g2 px-1 text-paragraph text-brand-w2"
      >
        {c}
      </div>
    ))}
  </div>
)
