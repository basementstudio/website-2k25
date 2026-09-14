// Shared building blocks for the machine-view pages (/ai and its sub-pages):
// terminal-styled section rules, key-value rows, and the common link style.

import Link from "next/link"

export const linkClass =
  "underline underline-offset-4 transition-colors hover:text-machine-bright"

const isMachineHref = (href: string) =>
  href === "/ai" || href.startsWith("/ai/")

/**
 * Client-side `<Link>` for intra-machine hrefs so the layout (header, boot
 * shutter) survives the navigation; everything else — human pages (the WebGL
 * canvas needs a real document load), `.md` mirrors, external, mailto — stays
 * a plain full-navigation anchor.
 */
export const MachineLink = ({
  href,
  className = linkClass,
  children
}: {
  href: string
  className?: string
  children: React.ReactNode
}) =>
  isMachineHref(href) ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  )

export const Section = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="flex w-full flex-col gap-3">
    <h2 className="w-full overflow-hidden whitespace-nowrap text-machine-dim">
      {`── ${title.toUpperCase()} ${"─".repeat(80)}`}
    </h2>
    {children}
  </section>
)

const FIELD_WIDTH = 15

// padEnd() counts UTF-16 units, so an astral glyph (𝕏 is U+1D54F, a surrogate
// pair) would eat two columns' worth of dots while occupying one — count code
// points instead so the leaders stay aligned.
const dotLeader = (label: string) =>
  `${label} ` + ".".repeat(Math.max(0, FIELD_WIDTH - [...label].length - 1))

/** `label ....... value` key-value row; mono font keeps the dots aligned. */
export const Field = ({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) => (
  <div className="flex">
    <dt className="shrink-0 whitespace-pre text-machine-dim">
      {dotLeader(label)}{" "}
    </dt>
    {/* min-w-0 + anywhere wrapping: unbroken values (URLs) must not push the
        page wider than the viewport on small screens. */}
    <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
  </div>
)
