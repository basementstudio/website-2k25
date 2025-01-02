import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import * as React from "react"

import { cn } from "@/utils/cn"

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "h-4 cursor-pointer border border-brand-g2 px-0.75 !text-paragraph text-brand-w2 hover:text-brand-w1 data-[state=checked]:bg-brand-g2",
      className
    )}
    {...props}
  />
))

Checkbox.displayName = CheckboxPrimitive.Root.displayName
