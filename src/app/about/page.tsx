const About = () => (
  <main className="relative -mt-24 min-h-96 w-full bg-brand-k px-4 pt-2">
    <h1 className="text-heading uppercase text-brand-w2">About</h1>

    <div className="flex flex-col gap-4 pt-24">
      <div className="flex gap-2">
        <div className="size-6 bg-brand-w1" />
        <div className="size-6 bg-brand-w2" />
        <div className="size-6 bg-brand-g1" />
        <div className="size-6 bg-brand-g2" />
        <div className="size-6 bg-brand-o" />
      </div>

      <p className="text-heading uppercase text-brand-w2">H1 title</p>
      <p className="text-subheading text-brand-w2">H2 Subtitle</p>
      <p className="text-paragraph text-brand-w2">P Copy</p>
      <p className="actionable text-brand-w1">Buttons</p>
    </div>
  </main>
);

export default About;
