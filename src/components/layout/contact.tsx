import { Link } from "@/components/primitives/link"

export const Contact = () => {
  return (
    <div className="grid-layout">
      <div className="relative col-span-full grid h-fit grid-cols-4 gap-2 !px-0 lg:col-span-10 lg:col-start-3 lg:grid-cols-10">
        <h3 className="col-span-2 mb-2 text-mobile-h4 text-brand-g1 lg:text-h4">
          Contact
        </h3>

        <p className="col-span-8 row-start-2 text-mobile-h1 text-brand-w2 lg:text-h1">
          Let&apos;s make an impact together.
        </p>

        <Link
          href="mailto:hello@basement.studio"
          className="col-span-5 row-start-3 text-mobile-h1 text-brand-w1 lg:text-h1"
        >
          <span className="actionable">hello@basement.studio</span>
        </Link>

        <div className="with-diagonal-lines pointer-events-none !absolute inset-0" />
      </div>
    </div>
  )
}
