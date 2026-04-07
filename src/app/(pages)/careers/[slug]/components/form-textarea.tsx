import type { UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/utils/cn"

import { FormError } from "./form-error"
import { FormLabel } from "./form-label"

interface FormTextareaProps {
  label: string
  required?: boolean
  error?: string
  placeholder?: string
  registration: UseFormRegisterReturn
  rows?: number
  maxLength?: number
  className?: string
}

export const FormTextarea = ({
  label,
  required,
  error,
  placeholder,
  registration,
  rows = 3,
  maxLength,
  className
}: FormTextareaProps) => {
  const inputId = registration.name

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <FormLabel label={label} required={required} htmlFor={inputId} />
      <div className="flex flex-col">
        <textarea
          id={inputId}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "w-full resize-none border-0 bg-brand-g2 px-1 py-0.5 text-[1rem] font-medium leading-6 text-brand-w2 outline-none placeholder:text-brand-g1 [&:-webkit-autofill:focus]:shadow-[inset_0_0_0_9999px_#23232395] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0_9999px_#23232395] [&:-webkit-autofill]:shadow-[inset_0_0_0_9999px_#23232395]",
            error && "shadow-[inset_0_0_0_9999px_#F32D2D33]",
            className
          )}
          {...registration}
        />
        <div className="mt-1.5 min-h-5">
          {error ? <FormError message={error} id={`${inputId}-error`} /> : null}
        </div>
      </div>
    </div>
  )
}
