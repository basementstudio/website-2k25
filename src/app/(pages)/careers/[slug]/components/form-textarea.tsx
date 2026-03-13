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
            "w-full resize-none bg-brand-g2 px-1 py-0.5 text-[1rem] font-medium leading-6 text-brand-w2 outline-none placeholder:text-brand-g1",
            error
              ? "bg-[image:linear-gradient(rgba(243,45,45,0.2),rgba(243,45,45,0.2)),linear-gradient(var(--color-brand-g2),var(--color-brand-g2))]"
              : ""
          ].join(" ")}
          {...registration}
        />
        {error ? <FormError message={error} /> : null}
      </div>
    </div>
  )
}
