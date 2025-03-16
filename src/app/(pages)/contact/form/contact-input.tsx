import { UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/utils/cn"

export const ContactInput = ({
  placeholder,
  type = "text",
  register,
  errors
}: {
  placeholder: string
  type?: string
  register: UseFormRegisterReturn
  errors?: any
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 pt-4",
        type === "textarea" ? "flex-1" : ""
      )}
    >
      {type === "textarea" ? (
        <textarea
          {...register}
          placeholder={placeholder}
          className="remove-focus-styles h-full min-h-[320px] w-full resize-none bg-transparent text-start align-top text-[54px] text-f-h1-mobile font-semibold leading-none outline-none placeholder:text-brand-g2 xl:text-[56px] xl:tracking-[-2.24px]"
        />
      ) : (
        <input
          {...register}
          type={type}
          name={register.name}
          placeholder={placeholder}
          className="remove-focus-styles h-[56px] w-full bg-transparent text-f-h1-mobile font-semibold leading-none outline-none placeholder:text-brand-g2 xl:text-[56px] xl:tracking-[-2.24px]"
        />
      )}
      <div className="relative z-10 h-px w-full bg-brand-g2" />
      {errors && errors[register.name] && (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[#F32D2D33]/30" />
      )}
    </div>
  )
}
