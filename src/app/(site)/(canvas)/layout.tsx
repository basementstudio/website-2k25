import { SetCanvasMode } from "@/components/layout/set-canvas-mode"

// Routes here show the persistent 3D canvas (mounted in the root layout).
// The margin reserves the space the canvas occupies; plain routes get none.
export default function CanvasGroupLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SetCanvasMode enabled />
      <div className="layout-container mt-[80svh] lg:mt-[100dvh]">{children}</div>
    </>
  )
}
