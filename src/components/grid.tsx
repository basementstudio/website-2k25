export const Grid = () => (
  <div className="pointer-events-none absolute top-0 flex h-full w-full justify-center">
    <div className="grid-layout pointer-events-none relative h-full">
      <div className="absolute left-[7px] h-full w-px bg-brand-w1/[0.1]" />
      <div className="col-span-2 border-r border-brand-w1/[0.08]" />
      <div className="col-span-2 border-l border-r border-brand-w1/[0.08]" />
      <div className="col-span-2 border-l border-r border-brand-w1/[0.08]" />
      <div className="col-span-2 border-l border-r border-brand-w1/[0.08]" />
      <div className="col-span-2 border-l border-r border-brand-w1/[0.08]" />
      <div className="col-span-2 border-l border-brand-w1/[0.08]" />
      <div className="absolute right-[7px] h-full w-px bg-brand-w1/[0.1]" />
    </div>
  </div>
)
