import { Link } from "@/components/primitives/link"

export const Contact = () => (
  <div className="grid-layout pb-16 pt-12 lg:pb-32 lg:pt-16">
    <div className="relative col-span-full grid h-fit grid-cols-4 gap-2 !px-0 lg:col-span-10 lg:col-start-2 lg:grid-cols-10 2xl:col-start-3">
      <h3 className="text-f-h3-mobile lg:text-f-h3 col-span-2 mb-2 text-brand-g1">
        Contact
      </h3>

      <div className="with-diagonal-lines pointer-events-none !absolute inset-0" />

      <p className="relative col-span-8 row-start-2 text-f-h1-mobile text-brand-w2 lg:text-f-h1">
        Let&apos;s make an impact together.
      </p>

      <Link
        href="mailto:hello@basement.studio"
        className="relative col-span-5 row-start-3 text-f-h1-mobile text-brand-w1 lg:text-f-h1"
      >
        <span className="actionable">hello@basement.studio</span>
      </Link>
    </div>
  </div>
)
