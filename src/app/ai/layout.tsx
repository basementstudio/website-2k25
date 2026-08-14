import { ModeToggle } from "@/components/layout/mode-toggle"

/**
 * Machine-view tree. Mounted outside `(site)` on purpose: the machine view
 * must not load the navbar, WebGL canvas, or analytics providers — only the
 * root fonts/styles.
 */
const AiLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {/* z-50 keeps the boot shutter under the mode toggle (z-navbar), so the
          pill stays visible while the page text paints in. */}
      <div
        aria-hidden="true"
        className="machine-reveal pointer-events-none fixed inset-0 z-50 bg-machine-bg"
      />
      {/* CRT scanlines over everything, including the pill and boot shutter. */}
      <div
        aria-hidden="true"
        className="machine-scanlines pointer-events-none fixed inset-0 z-[1200]"
      />
      <div className="machine-screen min-h-svh overflow-x-clip bg-machine-bg font-mono text-machine-base">
        {children}
        <ModeToggle mode="machine" />
      </div>
    </>
  )
}

export default AiLayout
