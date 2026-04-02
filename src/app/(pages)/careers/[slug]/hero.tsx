export const Hero = ({ position }: { position: string }) => (
  <section className="grid-layout text-f-h1-mobile lg:text-f-h1">
    <h1 className="col-span-full text-brand-w1 lg:col-start-1 lg:col-end-11">
      {position}
    </h1>
  </section>
)
