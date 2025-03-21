import { ReactNode } from "react"

import { cn } from "@/utils/cn"

interface InfoItemProps {
  label: ReactNode
  value: ReactNode
  className?: string
  labelClassName?: string
  valueClassName?: string
}

export const InfoItem = ({
  label,
  value,
  className,
  labelClassName,
  valueClassName
}: InfoItemProps) => (
  <li
    className={cn(
      "text-f-p-mobile lg:text-f-p grid grid-cols-4 items-start gap-2 py-1",
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
