import { Fragment, ReactNode } from "react"

import { cn } from "@/utils/cn"

export const TextList = ({
  value,
  className
}: {
  value: ReactNode[]
  className?: string
}) => {
  return (
    <p className={cn("inline-flex flex-wrap gap-x-1 text-p", className)}>
      {value.map((v, i) => (
        <Fragment key={i}>
          {v}
          {i < value.length - 1 && <span className="text-brand-g1">, </span>}
        </Fragment>
      ))}
    </p>
  )
}
