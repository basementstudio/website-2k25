import { ErrorAlert } from "@/components/icons/icons"

interface FormErrorProps {
  message: string
}

export const FormError = ({ message }: FormErrorProps) => {
  return (
    <div className="flex items-center gap-2">
      <ErrorAlert className="size-4 shrink-0 text-[#F32D2D]" />
      <p className="text-f-p text-[#F32D2D]">{message}</p>
    </div>
  )
}
