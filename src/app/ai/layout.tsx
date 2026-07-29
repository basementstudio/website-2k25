import { ModeToggle } from "@/components/layout/mode-toggle"
import { JsonLd } from "@/lib/structured-data/json-ld"
import { generateOrganizationSchema } from "@/lib/structured-data/schemas/organization"
import { fetchOrganizationData } from "@/service/sanity/organization"

/**
 * Machine-view tree. Mounted outside `(site)` on purpose: the machine view
 * must not load the navbar, WebGL canvas, or analytics providers — only the
 * root fonts/styles. The Organization JSON-LD the `(site)` layout provides is
 * re-rendered here so `/ai` keeps the entity schema.
 */
const AiLayout = async ({ children }: { children: React.ReactNode }) => {
  const orgData = await fetchOrganizationData()

  return (
    <>
      <JsonLd data={generateOrganizationSchema(orgData)} />
      <div
        aria-hidden="true"
        className="machine-reveal pointer-events-none fixed inset-0 z-[1100] bg-brand-k"
      />
      <div className="min-h-svh font-mono text-brand-w1">{children}</div>
      <ModeToggle mode="machine" />
    </>
  )
}

export default AiLayout
