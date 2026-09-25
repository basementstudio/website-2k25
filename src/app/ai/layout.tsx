import { ModeToggle } from "@/components/layout/mode-toggle"

import { MachineHeader } from "./machine-header"

/**
 * Machine-view tree. Mounted outside `(site)` on purpose: the machine view
 * must not load the navbar, WebGL canvas, or analytics providers — only the
 * root fonts/styles.
 *
 * The page shell and `MachineHeader` live in this layout so they persist
 * across intra-machine navigations: only the content below the nav
 * re-renders, and the boot shutter plays once per document load.
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
        {/* The f-p tokens bake in a tight 1rem line-height; leading-normal
            must repeat at lg:, where lg:text-f-p would otherwise win the
            cascade. */}
        <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-24 pt-12 text-f-p-mobile leading-normal text-machine-base lg:text-f-p lg:leading-normal">
          <header className="mb-4 flex flex-col gap-4 uppercase">
            <MachineHeader />
          </header>
          {children}
        </main>
        <ModeToggle mode="machine" />
      </div>
    </>
  )
}

export default AiLayout
