import { useEffect, useRef } from "react"
import { Matrix4, PerspectiveCamera, Vector3 } from "three"

const v1 = new Vector3()
const tempMatrix = new Matrix4()
const tempCamera = new PerspectiveCamera()

interface ContactScreenProps {
  screenboneMatrix: number[] | null
  cameraMatrix: number[] | null
  children?: React.ReactNode
}

const ContactScreen = ({
  screenboneMatrix,
  cameraMatrix,
  children
}: ContactScreenProps) => {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!divRef.current || !screenboneMatrix || !cameraMatrix) return

    // Convert array to matrix
    tempMatrix.fromArray(screenboneMatrix)

    // Set up camera with the matrix
    tempCamera.matrixWorld.fromArray(cameraMatrix)
    tempCamera.matrixWorldInverse.copy(tempCamera.matrixWorld).invert()

    // Get world position from matrix
    const objectPos = v1.setFromMatrixPosition(tempMatrix)

    // Project point to screen space
    objectPos.project(tempCamera)

    // Convert to pixel coordinates
    const widthHalf = window.innerWidth / 2
    const heightHalf = window.innerHeight / 2
    const x = objectPos.x * widthHalf + widthHalf - 380
    const y = -(objectPos.y * heightHalf) + heightHalf - 220

    // Get scale based on z distance
    const scale = 1 / Math.max(1, -objectPos.z)

    // Apply transform
    divRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
  }, [screenboneMatrix, cameraMatrix])

  return (
    <div
      ref={divRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: "translate3d(0, 0, 0)",
        transformOrigin: "center",
        pointerEvents: "none",
        zIndex: 1000
      }}
    >
      {children}
    </div>
  )
}

export default ContactScreen
