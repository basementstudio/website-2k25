import * as Select from "@radix-ui/react-select"

import { FormError } from "./form-error"
import { FormLabel } from "./form-label"

interface FormSelectProps {
  label: string
  required?: boolean
  options: string[]
  placeholder?: string
  name?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
}

export const FormSelect = ({
  label,
  required,
  options,
  placeholder,
  name,
  value,
  onChange,
  onBlur,
  error
}: FormSelectProps) => {
  return (
    <div className="flex flex-col gap-3 lg:gap-4">
      <FormLabel label={label} required={required} />
      <div className="flex flex-col gap-3">
        <Select.Root value={value} onValueChange={onChange}>
          <Select.Trigger
            name={name}
            onBlur={onBlur}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? "yearsOfExperience-error" : undefined}
            className={[
              "flex h-7 w-full items-center justify-between border-0 bg-brand-g2 px-1 text-[1rem] font-medium leading-6 text-brand-w2 outline-none data-[placeholder]:text-brand-g1",
              error ? "shadow-[inset_0_0_0_9999px_#F32D2D33]" : ""
            ].join(" ")}
          >
            <Select.Value placeholder={placeholder} />
            <Select.Icon>
              <ChevronDownIcon />
            </Select.Icon>
          </Select.Trigger>

          <Select.Portal>
            <Select.Content
              position="popper"
              sideOffset={4}
              className="z-50 max-h-60 w-[var(--radix-select-trigger-width)] min-w-48 overflow-auto bg-[#171717] py-1"
            >
              <Select.Viewport>
                {options.map((option) => (
                  <Select.Item
                    key={option}
                    value={option}
                    className="cursor-pointer select-none px-2 py-1.5 text-[1rem] font-medium leading-6 text-brand-w2 outline-none data-[highlighted]:bg-brand-w1/10"
                  >
                    <Select.ItemText>{option}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
        {error ? (
          <FormError message={error} id="yearsOfExperience-error" />
        ) : null}
      </div>
    </div>
  )
}

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#999"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)
