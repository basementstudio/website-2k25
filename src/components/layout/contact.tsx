import { Link } from "@/components/primitives/link"

export const Contact = () => (
  <div className="grid-layout">
    <h2 className="text-mobile-h2 col-span-full text-brand-w1 lg:col-span-2 lg:text-h2">
      Contact:
    </h2>

    <div className="relative col-span-full grid h-40 grid-cols-4 grid-rows-[2rem,1rem] gap-2 !px-0 lg:col-span-10 lg:grid-cols-10">
      <p className="text-mobile-h2 relative z-10 col-span-3 h-max w-max bg-brand-k text-brand-g1 lg:col-span-4 lg:text-h2">
        (hello@basement.studio)
      </p>

      <div className="col-span-full lg:col-span-6">
        <p className="text-mobile-h2 relative z-10 h-max w-full bg-brand-k text-brand-w1 lg:w-max lg:text-h2">
          Let&apos;s make an impact, together.
          <br />
        </p>
        <Link
          href="mailto:hello@basement.studio"
          className="actionable text-mobile-h2 relative z-10 col-span-full h-max w-max bg-brand-k text-brand-w1 lg:col-start-6 lg:text-h2"
        >
          Get in touch
        </Link>
      </div>

      <div className="with-diagonal-lines !absolute inset-0" />
    </div>
  </div>
)
