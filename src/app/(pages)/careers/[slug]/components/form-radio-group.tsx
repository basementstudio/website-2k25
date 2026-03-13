import type { UseFormRegisterReturn } from "react-hook-form"

import { FormLabel } from "./form-label"

interface FormRadioGroupProps {
  label: string
  required?: boolean
  options: string[]
  registration: UseFormRegisterReturn
}

export const FormRadioGroup = ({
  label,
  required,
  options,
  registration
}: FormRadioGroupProps) => {
  return (
    <fieldset className="flex flex-col gap-3 lg:gap-4">
      <FormLabel label={label} required={required} as="legend" />
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option}
            className="group flex cursor-pointer items-center gap-2"
          >
            <input
              type="radio"
              value={option}
              className="sr-only"
              {...registration}
            />
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-g2 group-has-[:focus-visible]:ring-1 group-has-[:focus-visible]:ring-brand-o group-has-[:focus-visible]:ring-offset-2 group-has-[:focus-visible]:ring-offset-brand-k">
              <span className="size-2 rounded-full bg-brand-w1 opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
            </span>
            <span className="text-[1rem] font-medium leading-6 text-brand-w1">
              {option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
