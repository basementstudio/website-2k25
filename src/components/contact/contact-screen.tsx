import { useEffect, useRef } from "react"
import * as THREE from "three"
import { Matrix4 } from "three"

interface ContactScreenProps {
  worker: Worker
}

const ContactScreen = ({ worker }: ContactScreenProps) => {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const updatePositionRef = useRef<(() => void) | null>(null)
  const epsilon = (value: number) => (Math.abs(value) < 1e-10 ? 0 : value)

  function getCSSMatrix(matrix: Matrix4, multipliers: number[], prepend = "") {
    let matrix3d = "matrix3d("
    for (let i = 0; i !== 16; i++) {
      matrix3d +=
        epsilon(multipliers[i] * matrix.elements[i]) + (i !== 15 ? "," : ")")
    }
    return prepend + matrix3d
  }

  const getCameraCSSMatrix = ((multipliers: number[]) => {
    return (matrix: Matrix4) => getCSSMatrix(matrix, multipliers)
  })([1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1])

  const getObjectCSSMatrix = ((scaleMultipliers: (n: number) => number[]) => {
    return (matrix: Matrix4, factor: number) =>
      getCSSMatrix(matrix, scaleMultipliers(factor), "translate(-50%,-50%)")
  })((f: number) => [
    1 / f,
    1 / f,
    1 / f,
    1,
    -1 / f,
    -1 / f,
    -1 / f,
    -1,
    1 / f,
    1 / f,
    1 / f,
    1,
    1,
    1,
    1,
    1
  ])

  useEffect(() => {
    if (!worker) return

    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "update-screen-skinned-matrix") {
        const { screenboneMatrix, cameraMatrix, size } = e.data
        updatePositionRef.current = () => {
          const boneMatrix = new THREE.Matrix4().fromArray(screenboneMatrix)
          const camMatrix = new THREE.Matrix4().fromArray(cameraMatrix)

          const width = size?.width || window.innerWidth
          const height = size?.height || window.innerHeight
          const [widthHalf, heightHalf] = [width / 2, height / 2]

          const fov = e.data.fov || 75 * heightHalf

          const cameraStyle = getCameraCSSMatrix(camMatrix)
          const distanceFactor = 10
          const scaleFactor = 1 / (distanceFactor / 10)
          const objectStyle = getObjectCSSMatrix(boneMatrix, scaleFactor)

          if (outerRef.current) {
            outerRef.current.style.width = `${width}px`
            outerRef.current.style.height = `${height}px`
            outerRef.current.style.perspective = `${fov}px`
            outerRef.current.style.transform = `translateZ(${fov}px)${cameraStyle}translate(${widthHalf}px,${heightHalf}px)`
          }

          if (innerRef.current) {
            innerRef.current.style.transform = objectStyle
          }
        }

        updatePositionRef.current()
        window.addEventListener("resize", updatePositionRef.current)
      }
    }

    worker.addEventListener("message", handleMessage)

    return () => {
      worker.removeEventListener("message", handleMessage)
      if (updatePositionRef.current) {
        window.removeEventListener("resize", updatePositionRef.current)
      }
    }
  }, [worker])

  return (
    <div
      ref={outerRef}
      className="absolute left-0 top-0 z-50 h-full w-full"
      style={{
        transformStyle: "preserve-3d",
        pointerEvents: "none"
      }}
    >
      <div
        ref={innerRef}
        style={{ position: "absolute", pointerEvents: "auto" }}
      >
        <div ref={contentRef}>
          <div className="relative z-20 h-[200px] w-[200px] bg-red-500"></div>
        </div>
      </div>
    </div>
  )
}

export default ContactScreen
