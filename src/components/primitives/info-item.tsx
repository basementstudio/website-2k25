import { ReactNode } from "react"

import { cn } from "@/utils/cn"

export const InfoItem = ({
  label,
  value,
  className,
  labelClassName,
  valueClassName
}: {
  label: ReactNode
  value: ReactNode
  className?: string
  labelClassName?: string
  valueClassName?: string
}) => {
  return (
    <li
      className={cn(
        "grid grid-cols-4 items-start gap-2 py-1 text-p",
        className
      )}
    >
      <span className={cn("col-span-1 text-brand-g1", labelClassName)}>
        {label}
      </span>
      <span className={cn("col-span-3 text-brand-w1", valueClassName)}>
        {value}
      </span>
    </li>
  )
}
