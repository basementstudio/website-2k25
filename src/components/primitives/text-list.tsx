import { Fragment, ReactNode } from "react"

export const TextList = ({ value }: { value: ReactNode[] }) => {
  return (
    <p className="inline-flex flex-wrap gap-1 text-p">
      {value.map((v, i) => (
        <Fragment key={i}>
          {v}
          {i < value.length - 1 && <span className="text-brand-g1">, </span>}
        </Fragment>
      ))}
    </p>
  )
}
