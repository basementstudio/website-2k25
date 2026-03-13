import type { UseFormRegisterReturn } from "react-hook-form"

import { FormLabel } from "./form-label"

interface FormCheckboxGroupProps {
  label: string
  required?: boolean
  description?: string
  options: { label: string; value: string }[]
  defaultValues?: string[]
  registration: UseFormRegisterReturn
}

export const FormCheckboxGroup = ({
  label,
  required,
  description,
  options,
  defaultValues,
  registration
}: FormCheckboxGroupProps) => {
  return (
    <fieldset className="flex flex-col gap-3 lg:gap-4">
      <FormLabel
        label={label}
        required={required}
        description={description}
        as="legend"
      />
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="group flex cursor-pointer items-center gap-2"
          >
            <input
              type="checkbox"
              value={option.value}
              defaultChecked={defaultValues?.includes(option.value)}
              className="sr-only"
              {...registration}
            />
            <span className="flex size-6 shrink-0 items-center justify-center bg-brand-g2 text-brand-w1 group-has-[:focus-visible]:ring-1 group-has-[:focus-visible]:ring-brand-o group-has-[:focus-visible]:ring-offset-2 group-has-[:focus-visible]:ring-offset-brand-k">
              <svg
                className="size-4 opacity-0 transition-opacity group-has-[:checked]:opacity-100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="text-[1rem] font-medium leading-6 text-brand-w1">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
