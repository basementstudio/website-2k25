import { Link } from "@/components/primitives/link"

export const Contact = () => (
  <div className="grid-layout">
    <h2 className="col-span-2 text-h2 text-brand-w1">Contact:</h2>

    <div className="relative col-span-10 grid h-40 grid-cols-10 grid-rows-[2rem,1rem] gap-2 !px-0">
      <p className="relative z-10 col-span-4 h-max w-max bg-brand-k text-h2 text-brand-g1">
        (hello@basement.studio)
      </p>

      <div className="col-span-6">
        <p className="relative z-10 h-max w-max bg-brand-k text-h2 text-brand-w1">
          Let&apos;s make an impact, together.
          <br />
        </p>
        <Link
          href="mailto:hello@basement.studio"
          className="actionable relative z-10 col-start-6 h-max w-max bg-brand-k text-h2 text-brand-w1"
        >
          Get in touch
        </Link>
      </div>

      <div className="with-diagonal-lines !absolute inset-0" />
    </div>
  </div>
)
