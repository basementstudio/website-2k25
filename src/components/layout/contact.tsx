"use client"

import { Link } from "@/components/primitives/link"

import { useContactStore } from "../contact/contact-store"

export const Contact = () => {
  const { setIsContactOpen } = useContactStore()

  return (
    <div className="grid-layout">
      <h2 className="col-span-full text-mobile-h2 text-brand-w1 lg:col-span-2 lg:text-h2">
        Drop us a Line:
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
            Let&apos;s Make an Impact, Together.
            <br />
          </p>
          <button
            className="relative z-10 col-span-full h-max w-max bg-brand-k text-mobile-h2 text-brand-w1 lg:col-start-6 lg:text-h2"
            onClick={() => setIsContactOpen(true)}
            type="button"
          >
            <span className="actionable">Get in Touch</span>
          </button>
        </div>

        {/* <div
          className="!absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_5291_41324)' stroke='%23fff' stroke-opacity='.3'%3E%3Cpath d='M-27 27 91-91M-27 33.3999l118-118M-27 39.8 91-78.1999M-27 46.2l118-118M-27 52.6001l118-118M-27 59 91-59M-27 65.3999l118-118M-27 71.8 91-46.1999M-27 78.2l118-118M-27 84.5999l118-118M-27 91 91-27M-27 97.3999l118-118M-27 103.8 91-14.2002M-27 110.2 91-7.80004M-27 116.6 91-1.40014M-27 123 91 5M-27 129.4 91 11.3999M-27 135.8 91 17.7998M-27 142.2l118-118M-27 148.6 91 30.5999M-27 155 91 37'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_5291_41324'%3E%3Cpath fill='%23fff' d='M0 0h64v64H0z'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat"
          }}
        /> */}

        <div
          className="!absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_5291_41301)' stroke='%23fff' stroke-opacity='.3'%3E%3Cpath d='M-27 27 91-91M-27 35 91-83M-27 43 91-75M-27 51 91-67M-27 59 91-59M-27 67 91-51M-27 75 91-43M-27 83 91-35M-27 91 91-27M-27 99 91-19M-27 107 91-11M-27 115 91-3M-27 123 91 5M-27 131 91 13M-27 139 91 21M-27 147 91 29M-27 155 91 37'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id='clip0_5291_41301'%3E%3Cpath fill='%23fff' d='M0 0h64v64H0z'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E");`,
            backgroundRepeat: "repeat"
          }}
        />
      </div>
    </div>
  )
}
