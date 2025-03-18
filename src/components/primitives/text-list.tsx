import { Fragment, type ReactNode } from "react"

import { cn } from "@/utils/cn"

export const TextList = ({
  value,
  className,
  showComma = true,
  hasWrapper = false
}: {
  value: ReactNode[]
  className?: string
  showComma?: boolean
  hasWrapper?: boolean
}) => {
  return (
    <p className={cn("inline-flex flex-wrap gap-x-1 text-p", className)}>
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
}
