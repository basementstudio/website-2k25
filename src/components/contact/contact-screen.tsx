import { useRef } from "react"
import { Matrix4, PerspectiveCamera, Vector3 } from "three"
import { useAnimationFrame } from "motion/react"
import * as THREE from "three"

const v1 = new Vector3()
const tempMatrix = new Matrix4()
const tempCamera = new PerspectiveCamera()
const quaternion = new THREE.Quaternion()
const position = new THREE.Vector3()
const scale = new THREE.Vector3()

interface ContactScreenProps {
  worker: Worker
  children?: React.ReactNode
}

const ContactScreen = ({ worker, children }: ContactScreenProps) => {
  const divRef = useRef<HTMLDivElement>(null)

  useAnimationFrame(() => {
    if (!divRef.current) return

    const handleWorkerMessage = (e: MessageEvent) => {
      if (!divRef.current) return

      if (e.data.type === "update-screen-skinned-matrix") {
        tempMatrix.fromArray(e.data.screenboneMatrix)
        tempCamera.matrixWorld.fromArray(e.data.cameraMatrix)
        tempCamera.matrixWorldInverse.copy(tempCamera.matrixWorld).invert()

        tempMatrix.decompose(position, quaternion, scale)

        const euler = new THREE.Euler().setFromQuaternion(quaternion)

        const rotX = -euler.x * (180 / Math.PI)
        const rotY = -euler.y * (180 / Math.PI)
        const rotZ = -euler.z * (180 / Math.PI)

        position.project(tempCamera)

        const widthHalf = window.innerWidth / 2
        const heightHalf = window.innerHeight / 2
        const x = position.x * widthHalf + widthHalf - 380
        const y = -(position.y * heightHalf) + heightHalf - 220

        divRef.current.style.transform = `translate(${x}px, ${y}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
      }
    }

    worker.addEventListener("message", handleWorkerMessage)

    return () => {
      worker.removeEventListener("message", handleWorkerMessage)
    }
  })

  return (
    <div
      ref={divRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
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
