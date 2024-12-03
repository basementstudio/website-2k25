const AboutPage = () => {
  return (
    <div className="relative h-screen w-full bg-black">
      <div className="absolute -top-[100px] left-0 flex h-[100px] w-full flex-col gap-4 bg-black p-24 text-white">
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
    </div>
  );
};

export default AboutPage;
