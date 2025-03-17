import { UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/utils/cn"

export const ContactInput = ({
  placeholder,
  type = "text",
  ...registerProps
}: {
  placeholder: string
  type?: string
} & UseFormRegisterReturn) => {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 pt-4",
        type === "textarea" ? "flex-1" : ""
      )}
    >
      {type === "textarea" ? (
        <textarea
          placeholder={placeholder}
          className="remove-focus-styles h-full min-h-[320px] w-full resize-none bg-transparent text-start align-top text-[54px] text-f-h1-mobile font-semibold leading-none outline-none placeholder:text-brand-g2 xl:text-[56px] xl:tracking-[-2.24px]"
          {...registerProps}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="remove-focus-styles h-[56px] w-full bg-transparent text-f-h1-mobile font-semibold leading-none outline-none placeholder:text-brand-g2 xl:text-[56px] xl:tracking-[-2.24px]"
          {...registerProps}
        />
      )}
      <div className="relative z-10 h-px w-full bg-brand-g2" />
    </div>
  )
}
