import { Link } from "../primitives/link"

export const Contact = () => (
  <div className="grid-layout pb-16 pt-12 lg:pb-32 lg:pt-16">
    <div className="relative col-span-full grid h-fit grid-cols-4 gap-2 !px-0 lg:col-span-10 lg:col-start-2 lg:grid-cols-10 2xl:col-start-3">
      <div className="with-diagonal-lines pointer-events-none !absolute inset-0" />

      <h3 className="relative col-span-2 mb-2 text-f-h3-mobile text-brand-g1 lg:text-f-h3">
        Contact
      </h3>

      <p className="relative col-span-8 row-start-2 text-f-h1-mobile text-brand-w2 lg:text-f-h1">
        Let&apos;s make an impact together.
      </p>

      <div className="relative col-span-5 row-start-3 flex items-center text-[2rem] text-f-h1-mobile text-brand-w1 lg:text-f-h1">
        <Link href="mailto:hello@basement.studio" target="_blank">
          <span className="actionable">hello@basement.studio</span>
        </Link>
      </div>
    </div>
  </div>
)
