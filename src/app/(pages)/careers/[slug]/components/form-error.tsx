import { ErrorAlert } from "@/components/icons/icons"

interface FormErrorProps {
  message: string
  id?: string
}

export const FormError = ({ message, id }: FormErrorProps) => {
  return (
    <div id={id} className="flex items-center gap-2" role="alert">
      <ErrorAlert className="size-4 shrink-0 text-brand-r2" />
      <p className="text-f-p font-normal text-brand-r2">{message}</p>
    </div>
  )
}
