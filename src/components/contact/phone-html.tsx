import { useEffect, useRef, useState } from "react"
import { Matrix4, PerspectiveCamera, Vector3 } from "three"

interface PhoneHtmlProps {
  screenboneMatrix: number[] | null
  cameraMatrix: number[] | null
  visible: boolean
}

const PhoneHtml = ({
  screenboneMatrix,
  cameraMatrix,
  visible
}: PhoneHtmlProps) => {
  // Transform settings state to control behavior
  const [settings, setSettings] = useState({
    invertX: true,
    invertY: true,
    scaleFactor: 1000,
    debugMode: false
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const latestMatricesRef = useRef<{
    boneMatrix: Matrix4 | null
    camMatrix: Matrix4 | null
  }>({
    boneMatrix: null,
    camMatrix: null
  })

  // Update the latest matrices reference whenever they change
  useEffect(() => {
    if (screenboneMatrix && cameraMatrix) {
      latestMatricesRef.current = {
        boneMatrix: new Matrix4().fromArray(screenboneMatrix),
        camMatrix: new Matrix4().fromArray(cameraMatrix)
      }
    }
  }, [screenboneMatrix, cameraMatrix])

  // Set up the animation frame loop for smoother updates
  useEffect(() => {
    if (!visible) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const updateTransform = () => {
      const { boneMatrix, camMatrix } = latestMatricesRef.current

      if (boneMatrix && camMatrix && containerRef.current) {
        // Calculate the CSS transform matrix with current settings
        const transformMatrix = calculateCssMatrix(
          boneMatrix,
          camMatrix,
          settings.invertX,
          settings.invertY,
          settings.scaleFactor
        )

        // Apply the transform to the div
        containerRef.current.style.transform = transformMatrix
      }

      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updateTransform)
    }

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(updateTransform)

    // Clean up
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [visible, settings])

  if (!visible) return null

  return (
    <>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          transformOrigin: "center",
          transform: "translate(-50%, -50%)", // Initial position
          borderRadius: "8px",
          pointerEvents: "auto",
          zIndex: 1000,
          display: screenboneMatrix && cameraMatrix ? "block" : "none"
        }}
      >
        {/* Content of the phone screen can go here */}
        <div style={{ padding: "20px" }}>Phone Screen Content</div>
      </div>
    </>
  )
}

// Helper function to calculate CSS matrix transform
function calculateCssMatrix(
  boneMatrix: Matrix4,
  cameraMatrix: Matrix4,
  invertX: boolean = true,
  invertY: boolean = true,
  scaleFactor: number = 1000
): string {
  try {
    // Extract position from bone matrix
    const position = new Vector3()
    position.setFromMatrixPosition(boneMatrix)

    // Get camera's inverse matrix
    const cameraInverse = new Matrix4().copy(cameraMatrix).invert()

    // Transform the position to camera space
    const localPosition = position.clone().applyMatrix4(cameraInverse)

    // Simple projection formula (perspective division)
    const scale = 1000 / Math.max(1000, Math.abs(localPosition.z) * 1000)

    // Calculate offsets with given inversion settings
    const xOffset = (invertX ? -1 : 1) * localPosition.x * scale * scaleFactor
    const yOffset = (invertY ? -1 : 1) * localPosition.y * scale * scaleFactor

    // Center in the screen and apply offsets
    const x = window.innerWidth / 2 + xOffset
    const y = window.innerHeight / 2 + yOffset

    return `translate3d(${x}px, ${y}px, 0) scale(${scale})`
  } catch (error) {
    console.error("Error calculating CSS matrix:", error)
    return "translate3d(50%, 50%, 0)" // Fallback position
  }
}

export default PhoneHtml
