export const Grid = () => (
  <div className="pointer-events-none absolute top-0 flex h-full w-full justify-center">
    <div className="grid-layout pointer-events-none relative h-full">
      <div className="absolute left-1.75 h-full w-px bg-brand-w1/[0.1]" />
      <div className="absolute right-1.75 h-full w-px bg-brand-w1/[0.1]" />
    </div>
  </div>
)
