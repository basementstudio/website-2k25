import { Environment, useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { AnimationMixer, AnimationUtils, LoopRepeat } from "three"

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  console.log("[ContactScene] model url", modelUrl)
  const gltf = useGLTF(modelUrl)
  const mixerRef = useRef<AnimationMixer | null>(null)

  // L-Idle
  // R-Idle
  // Buttons-1
  // Buttons-2
  // Buttons-3

  useEffect(() => {
    if (!gltf.scene || !gltf.animations.length) return

    mixerRef.current = new AnimationMixer(gltf.scene)
    const mixer = mixerRef.current

    const baseAnim = gltf.animations.find((anim) => anim.name === "L-Idle")
    const secondAnim = gltf.animations.find((anim) => anim.name === "R-Idle")

    if (baseAnim && secondAnim) {
      const idleClip1 = AnimationUtils.subclip(
        baseAnim,
        "idle1",
        0,
        baseAnim.duration * 30,
        30
      )
      const idleClip2 = AnimationUtils.subclip(
        secondAnim,
        "idle2",
        0,
        secondAnim.duration * 30,
        30
      )

      const action1 = mixer.clipAction(idleClip1)
      const action2 = mixer.clipAction(idleClip2)

      action1.setLoop(LoopRepeat, Infinity)
      action2.setLoop(LoopRepeat, Infinity)

      action1.play()
      action2.play()
    }
  }, [gltf])

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }
  })

  return (
    <>
      <Environment environmentIntensity={0.25} preset="studio" />
      <group scale={8}>
        <primitive position-y={-0.1} object={gltf.scene} />
      </group>
    </>
  )
}

export default ContactScene
