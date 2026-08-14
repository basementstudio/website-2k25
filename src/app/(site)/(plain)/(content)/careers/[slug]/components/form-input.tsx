import type { InputHTMLAttributes, KeyboardEventHandler } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/utils/cn"

import { FormError } from "./form-error"
import { FormLabel } from "./form-label"

interface FormInputProps {
  label: string
  required?: boolean
  description?: string
  error?: string
  type?: "text" | "email" | "url" | "number" | "tel"
  placeholder?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"]
  min?: number
  step?: number
  pattern?: string
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  registration: UseFormRegisterReturn
}

export const FormInput = ({
  label,
  required,
  description,
  error,
  type = "text",
  placeholder,
  inputMode,
  min,
  step,
  pattern,
  onKeyDown,
  registration
}: FormInputProps) => {
  const inputId = registration.name

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <FormLabel
        label={label}
        required={required}
        description={description}
        htmlFor={inputId}
      />
      <div className="flex flex-col">
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          inputMode={inputMode}
          min={min}
          step={step}
          pattern={pattern}
          onKeyDown={onKeyDown}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            "w-full border-0 bg-brand-g2 px-1 py-0.5 text-[1rem] font-medium leading-6 text-brand-w2 outline-none placeholder:text-brand-g1 [&:-webkit-autofill:focus]:shadow-[inset_0_0_0_9999px_#23232395] [&:-webkit-autofill:hover]:shadow-[inset_0_0_0_9999px_#23232395] [&:-webkit-autofill]:shadow-[inset_0_0_0_9999px_#23232395]",
            error && "shadow-[inset_0_0_0_9999px_#F32D2D33]"
          )}
          {...registration}
        />
        <div className="mt-2 min-h-5">
          {error ? <FormError message={error} id={`${inputId}-error`} /> : null}
        </div>
      </div>
    </div>
  )
}
