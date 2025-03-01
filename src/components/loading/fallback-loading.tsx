import { useEffect, useRef } from "react"

export function FallbackLoading() {
  return null
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Make sure canvas is sized correctly to the container
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Simple animation loop
    let frame = 0
    let frameId: number

    const render = () => {
      frame++

      // Clear the canvas
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw text
      ctx.fillStyle = "#ffffff"
      ctx.font = "24px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Loading...", canvas.width / 2, canvas.height / 2 - 20)

      // Draw a spinning square
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2 + 40)
      ctx.rotate((frame * 0.02) % (Math.PI * 2))
      ctx.fillStyle = "#5046e4"
      ctx.fillRect(-20, -20, 40, 40)
      ctx.restore()

      frameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[200] bg-black">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ display: "block" }}
      />
    </div>
  )
}
