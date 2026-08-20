import { Navbar } from "@/components/layout/navbar"
import { SetCanvasMode } from "@/components/layout/set-canvas-mode"

// Routes here show the persistent 3D canvas (mounted in the root layout).
// The margin reserves the space the canvas occupies; plain routes get none.
// Navbar lives in the route groups, not (site), so the /404 page and the
// not-found boundary never ship it in their static HTML.
export default function CanvasGroupLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <SetCanvasMode enabled />
      <div className="layout-container mt-[var(--canvas-offset)]">
        {children}
      </div>
    </>
  )
}
