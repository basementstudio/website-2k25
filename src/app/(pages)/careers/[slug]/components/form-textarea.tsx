import type { UseFormRegisterReturn } from "react-hook-form"

import { FormError } from "./form-error"
import { FormLabel } from "./form-label"

interface FormTextareaProps {
  label: string
  required?: boolean
  error?: string
  placeholder?: string
  registration: UseFormRegisterReturn
  rows?: number
}

export const FormTextarea = ({
  label,
  required,
  error,
  placeholder,
  registration,
  rows = 3
}: FormTextareaProps) => {
  const inputId = registration.name

  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <FormLabel label={label} required={required} htmlFor={inputId} />
      <div className="flex flex-col gap-3">
        <textarea
          id={inputId}
          rows={rows}
          placeholder={placeholder}
          className={[
            "h-[52px] w-full resize-none border-0 px-1 py-0.5 text-[1rem] font-medium leading-6 text-brand-w2 outline-none placeholder:text-brand-g1 lg:h-auto",
            error
              ? "bg-brand-g2 shadow-[inset_0_0_0_9999px_#F32D2D33]"
              : "bg-brand-g2"
          ].join(" ")}
          {...registration}
        />
        {error ? <FormError message={error} /> : null}
      </div>
    </div>
  )
}
