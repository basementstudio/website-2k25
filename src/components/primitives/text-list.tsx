import { Fragment, type ReactNode } from "react"

import { cn } from "@/utils/cn"

interface TextListProps {
  value: ReactNode[]
  className?: string
  showComma?: boolean
  hasWrapper?: boolean
}

export const TextList = ({
  value,
  className,
  showComma = true,
  hasWrapper = false
}: TextListProps) => (
  <p
    className={cn(
      "text-f-p-mobile lg:text-f-p inline-flex flex-wrap gap-x-1",
      className
    )}
  >
    {value.map((v, i) => (
      <Fragment key={`text-item-${i}-${v}`}>
        {hasWrapper ? <span>{v}</span> : v}
        {showComma && i < value.length - 1 && (
          <span className="text-brand-g1">, </span>
        )}
      </Fragment>
    ))}
  </p>
)
