// Shared building blocks for the machine-view pages (/ai and its sub-pages):
// terminal-styled section rules, key-value rows, and the common link style.

export const linkClass =
  "underline underline-offset-4 transition-colors hover:text-machine-bright"

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
      {`${label} `.padEnd(15, ".")}{" "}
    </dt>
    {/* min-w-0 + anywhere wrapping: unbroken values (URLs) must not push the
        page wider than the viewport on small screens. */}
    <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
  </div>
)
