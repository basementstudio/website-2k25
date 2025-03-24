import { FieldErrors, UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/utils/cn"

export const ContactInput = ({
  placeholder,
  type = "text",
  errors,
  noBorder,
  className,
  ...registerProps
}: {
  placeholder: string
  type?: string
  errors?: FieldErrors
  noBorder?: boolean
  className?: string
} & UseFormRegisterReturn) => {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 pt-4",
        type === "textarea" ? "flex-1" : "",
        className
      )}
    >
      {type === "textarea" ? (
        <textarea
          placeholder={placeholder}
          className="remove-focus-styles min-h-[90px] w-full resize-none bg-transparent text-start align-top text-f-h3-mobile font-semibold leading-none outline-none placeholder:text-brand-g2 placeholder:transition-colors focus:placeholder:text-brand-w2 md:min-h-[280px] md:text-[54px] xl:text-[56px] xl:tracking-[-2.24px]"
          {...registerProps}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="remove-focus-styles w-full bg-transparent text-f-h3-mobile font-semibold leading-none outline-none placeholder:text-brand-g2 placeholder:transition-colors autofill:tracking-normal autofill:text-inherit focus:placeholder:text-brand-w2 md:h-[56px] xl:text-[56px] xl:tracking-[-2.24px]"
          {...registerProps}
        />
      )}
      {!noBorder && <div className="relative z-10 h-px w-full bg-brand-g2" />}
      {errors && errors[registerProps.name] && (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[#F32D2D33]/30" />
      )}
    </div>
  )
}
