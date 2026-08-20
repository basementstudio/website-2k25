import { Navbar } from "@/components/layout/navbar"
import { SetCanvasMode } from "@/components/layout/set-canvas-mode"

// Content routes: no 3D canvas, no canvas offset.
export default function PlainGroupLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <SetCanvasMode enabled={false} />
      <div className="layout-container">{children}</div>
    </>
  )
}
