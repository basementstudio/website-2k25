import { useEffect, useRef } from "react"
import * as THREE from "three"
import { Matrix4 } from "three"

interface ContactScreenProps {
  worker: Worker
}

const ContactScreen = ({ worker }: ContactScreenProps) => {
  const screenRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLDivElement>(null)
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
        const { screenboneMatrix, cameraMatrix } = e.data
        const updatePosition = () => {
          const boneMatrix = new THREE.Matrix4().fromArray(screenboneMatrix)
          const camMatrix = new THREE.Matrix4().fromArray(cameraMatrix)

          const style = getObjectCSSMatrix(boneMatrix, 1 / ((1 || 10) / 400))
          const cameraStyle = getCameraCSSMatrix(camMatrix)

          console.log("cameraStyle", cameraStyle)
          console.log("innerStyle", style)
          console.log("boneMatrix", boneMatrix)
          console.log("camMatrix", camMatrix)

          if (screenRef.current) {
            screenRef.current.style.transform = style
          }
          if (cameraRef.current) {
            cameraRef.current.style.transform = cameraStyle
          }
        }

        updatePosition()
        window.addEventListener("resize", updatePosition)
      }
    }

    worker.addEventListener("message", handleMessage)

    return () => {
      worker.removeEventListener("message", handleMessage)
    }
  }, [worker])

  return (
    <div
      ref={cameraRef}
      className="preserve-3d absolute z-50 h-[300px] w-[500px] bg-red-500"
    >
      <div ref={screenRef}></div>
    </div>
  )
}

export default ContactScreen
