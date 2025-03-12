import { InputHTMLAttributes } from "react"

import { cn } from "@/utils/cn"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      "h-5 bg-[rgb(26,26,26)] px-0.75 text-p text-brand-w2 outline-none placeholder:text-brand-g1 hover:bg-[#212121] focus:text-brand-w1",
      "disabled: border border-[#1A1A1A] disabled:bg-transparent disabled:text-brand-g2 disabled:placeholder:text-brand-g2",
      className
    )}
    {...props}
  />
)
