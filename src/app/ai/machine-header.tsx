// Shared header for every machine-view page: the BSMNT ASCII logo plus the
// section nav, so visitors can move between mirrors without bouncing off the
// /ai index.

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
  // The human home is the escape hatch; every other section has a machine twin.
  { href: "/", label: "home" },
  { href: "/ai/services", label: "services" },
  { href: "/ai/showcase", label: "showcase" },
  { href: "/ai/people", label: "people" },
  { href: "/ai/blog", label: "blog" },
  { href: "/ai/lab", label: "lab" },
  { href: "/ai/faq", label: "faq" },
  { href: "/ai/contact", label: "contact" }
]

/**
 * `current` is the nav href of the section this page belongs to (detail pages
 * pass their parent section, e.g. `/ai/blog` on a post) — it renders dim and
 * unlinked. Omit it on the /ai index, where every entry stays a link.
 */
export const MachineHeader = ({ current }: { current?: string }) => (
  <>
    <a href="/ai" aria-label="Machine index">
      {/* Font size scales with the viewport (46-char-wide art), capped so
        the logo sits at roughly 3/4 of the content column. */}
      <pre
        aria-hidden="true"
        className="w-full text-[min(16px,calc((100vw-2rem)/38))] leading-tight text-machine-base"
      >
        {ASCII_LOGO}
      </pre>
    </a>
    <nav aria-label="Site index" className="flex flex-wrap gap-x-4 gap-y-1">
      {NAV_LINKS.map((link) =>
        link.href === current ? (
          // Inverted terminal-selection block marks the page you're on.
          <span
            key={link.href}
            aria-current="page"
            className="bg-machine-base px-1 text-machine-bg"
          >
            {link.href}
          </span>
        ) : (
          <a key={link.href} href={link.href} className={linkClass}>
            {link.href}
          </a>
        )
      )}
    </nav>
  </>
)
