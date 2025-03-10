"use client"
import { Link } from "@/components/primitives/link"

import { useContactStore } from "../contact/contact-store"

export const Contact = () => {
  const { setIsContactOpen } = useContactStore()

  return (
    <div className="grid-layout">
      <h2 className="col-span-full text-mobile-h2 text-brand-w1 lg:col-span-2 lg:text-h2">
        Contact:
      </h2>

      <div className="relative col-span-full grid h-40 grid-cols-4 grid-rows-[2rem,1rem] gap-2 !px-0 lg:col-span-10 lg:grid-cols-10">
        <Link
          href="mailto:hello@basement.studio"
          className="relative z-10 col-span-3 h-max w-max bg-brand-k text-mobile-h2 text-brand-g1 lg:col-span-4 lg:text-h2"
        >
          <span className="actionable actionable-no-underline">
            (hello@basement.studio)
          </span>
        </Link>

        <div className="col-span-full lg:col-span-6">
          <p className="relative z-10 h-max w-full bg-brand-k text-mobile-h2 text-brand-w1 lg:w-max lg:text-h2">
            Let&apos;s make an impact, together.
            <br />
          </p>
          <button
            onClick={() => setIsContactOpen(true)}
            className="actionable relative z-10 col-span-full h-max w-max bg-brand-k text-mobile-h2 text-brand-w1 lg:col-start-6 lg:text-h2"
          >
            Get in touch
          </button>
        </div>

        <div className="with-diagonal-lines !absolute inset-0" />
      </div>
    </div>
  )
}
