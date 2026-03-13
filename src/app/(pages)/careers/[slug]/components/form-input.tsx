import type { UseFormRegisterReturn } from "react-hook-form"

import { FormError } from "./form-error"
import { FormLabel } from "./form-label"

interface FormInputProps {
  label: string
  required?: boolean
  description?: string
  error?: string
  type?: string
  placeholder?: string
  registration: UseFormRegisterReturn
}

export const FormInput = ({
  label,
  required,
  description,
  error,
  type = "text",
  placeholder,
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
      <div className="flex flex-col gap-3">
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          className={[
            "w-full bg-brand-g2 px-1 py-0.5 text-[1rem] font-medium leading-6 text-brand-w2 outline-none placeholder:text-brand-g1",
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
