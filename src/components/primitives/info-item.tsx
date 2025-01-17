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
    <li className={cn("grid grid-cols-6 items-start py-1 text-p", className)}>
      <span className={cn("col-span-2 text-brand-g1", labelClassName)}>
        {label}
      </span>
      <span className={cn("col-span-4 text-brand-w1", valueClassName)}>
        {value}
      </span>
    </li>
  )
}
