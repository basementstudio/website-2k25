import { SetCanvasMode } from "@/components/layout/set-canvas-mode"

// Routes here show the persistent 3D canvas (mounted in the root layout).
// The margin reserves space below the fixed full-screen canvas.
export default function CanvasGroupLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SetCanvasMode enabled />
      <div className="layout-container lg:mt-[100dvh]">{children}</div>
    </>
  )
}
