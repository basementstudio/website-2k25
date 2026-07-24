interface FormLabelProps {
  label: string
  required?: boolean
  description?: string
  as?: "label" | "legend"
  htmlFor?: string
}

export const FormLabel = ({
  label,
  description,
  as: Tag = "label",
  htmlFor
}: FormLabelProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Tag
        htmlFor={Tag === "label" ? htmlFor : undefined}
        className="flex gap-1 text-f-h4-mobile font-semibold lg:text-f-h3"
      >
        <span className="text-brand-w1">{label}</span>
      </Tag>
      {description ? (
        <p className="text-f-p-mobile text-brand-w2">{description}</p>
      ) : null}
    </div>
  )
}
