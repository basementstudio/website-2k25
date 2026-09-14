"use client"

// Shared header for every machine-view page: the BSMNT ASCII logo plus the
// section nav, so visitors can move between mirrors without bouncing off the
// /ai index. Mounted once in the /ai layout — nav links are client-side
// navigations, so the header (and the boot shutter behind it) never remounts
// while moving inside the machine view.

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"

import { linkClass } from "./components"

// "BSMNT" — ANSI-shadow block letters. Decorative only; the nav below is what
// crawlers read.
const ASCII_LOGO = `██████╗ ███████╗███╗   ███╗███╗   ██╗████████╗
██╔══██╗██╔════╝████╗ ████║████╗  ██║╚══██╔══╝
██████╔╝███████╗██╔████╔██║██╔██╗ ██║   ██║
██╔══██╗╚════██║██║╚██╔╝██║██║╚██╗██║   ██║
██████╔╝███████║██║ ╚═╝ ██║██║ ╚████║   ██║
╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝   ╚═╝`

const NAV_LINKS = [
  { href: "/ai/home", label: "home" },
  { href: "/ai/services", label: "services" },
  { href: "/ai/showcase", label: "showcase" },
  { href: "/ai/people", label: "people" },
  { href: "/ai/blog", label: "blog" },
  { href: "/ai/lab", label: "lab" },
  { href: "/ai/faq", label: "faq" },
  { href: "/ai/contact", label: "contact" }
]

// Detail pages highlight their parent section, matching the `current` values
// the pages used to pass explicitly: /ai/post/x → blog, /ai/careers/x → people.
const SECTION_ALIASES: Record<string, string> = {
  post: "blog",
  careers: "people"
}

const NavLinks = ({ current }: { current?: string }) => (
  <>
    {NAV_LINKS.map((link) =>
      link.href === current ? (
        // Inverted terminal-selection block marks the page you're on. px-1 is
        // cancelled by -mx-1 so the block is exactly as wide as the link it
        // replaces — otherwise the whole row shifts when the highlight moves.
        <span
          key={link.href}
          aria-current="page"
          className="-mx-1 bg-machine-base px-1 text-machine-bg"
        >
          /{link.label}
        </span>
      ) : (
        <Link key={link.href} href={link.href} className={linkClass}>
          /{link.label}
        </Link>
      )
    )}
  </>
)

const CurrentNavLinks = () => {
  const pathname = usePathname() ?? ""
  const segment = pathname.split("/")[2]
  const current = segment
    ? `/ai/${SECTION_ALIASES[segment] ?? segment}`
    : undefined

  return <NavLinks current={current} />
}

export const MachineHeader = () => (
  <>
    <Link href="/ai/home" aria-label="Machine index">
      {/* Font size scales with the viewport (46-char-wide art), capped so
        the logo sits at roughly 3/4 of the content column. */}
      <pre
        aria-hidden="true"
        className="w-full text-[min(16px,calc((100vw-2rem)/38))] leading-tight text-machine-base"
      >
        {ASCII_LOGO}
      </pre>
    </Link>
    {/* Short "/section" labels (hrefs keep the full /ai path) so all eight
      links fit one row in the 640px column; flex-wrap stays as the fallback
      for narrow phones. */}
    <nav aria-label="Site index" className="flex flex-wrap gap-x-4 gap-y-1">
      {/* Under Cache Components, usePathname suspends on fallback params (a
        slug published after the build), and an unwrapped suspension here
        would fail the whole layout's prerender — fall back to the same nav
        without the highlight. */}
      <Suspense fallback={<NavLinks />}>
        <CurrentNavLinks />
      </Suspense>
    </nav>
  </>
)
