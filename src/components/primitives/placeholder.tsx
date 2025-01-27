interface PlaceholderProps {
  className?: string
  width: number
  height: number
}

export const Placeholder = ({ className, width, height }: PlaceholderProps) => (
  <svg
    stroke="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox={`0 0 ${width} ${height}`}
    className={className}
  >
    <path d={`M0-.00024414 ${width} ${height}`} />
  </svg>
)
