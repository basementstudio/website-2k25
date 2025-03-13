import { useAnimations, useGLTF } from "@react-three/drei"
import { useCallback, useEffect, useRef } from "react"
import { Mesh, MeshBasicMaterial, LoopOnce, AnimationMixer } from "three"

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const { scene, animations } = useGLTF(modelUrl)
  const { actions, mixer } = useAnimations(animations, scene)
  const mixerRef = useRef<AnimationMixer | null>(null)

  // add mixer ref
  useEffect(() => {
    if (mixer) {
      mixerRef.current = mixer
    }
  }, [mixer])

  const playAnimation = useCallback(
    (animName: string, oppositeAnimName?: string) => {
      if (!actions[animName]) return

      if (oppositeAnimName && actions[oppositeAnimName])
        actions[oppositeAnimName].stop()

      const anim = actions[animName]
      anim.reset()
      anim.clampWhenFinished = true
      anim.loop = LoopOnce
      anim.play()

      // notify parent when animation is complete
      if (animName === "Outro-v2") {
        const onAnimationFinished = () => {
          self.postMessage({ type: "outro-complete" })
          mixer.removeEventListener("finished", onAnimationFinished)
        }
        mixer.addEventListener("finished", onAnimationFinished)
      }
    },
    [actions, mixer]
  )

  const runIntro = useCallback(() => {
    console.log("Running intro animation")
    playAnimation("Intro.001", "Outro-v2")
  }, [playAnimation])

  const runOutro = useCallback(() => {
    console.log("Running outro animation")
    playAnimation("Outro-v2", "Intro.001")
  }, [playAnimation])

  // add materials
  useEffect(() => {
    if (!scene) return

    scene.traverse((node) => {
      if (!(node instanceof Mesh) || !node.material || node.name === "SCREEN")
        return

      node.frustumCulled = false
      const oldMaterial = node.material
      const basicMaterial = new MeshBasicMaterial({
        color: "color" in oldMaterial ? oldMaterial.color : undefined,
        map: "map" in oldMaterial ? oldMaterial.map : undefined,
        opacity: "opacity" in oldMaterial ? oldMaterial.opacity : undefined
      })

      node.material = basicMaterial
    })
  }, [scene])

  // handle open
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "update-contact-open") {
        if (e.data.isContactOpen) runIntro()
        if (!e.data.isContactOpen) runOutro()
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [runIntro, runOutro])

  return <primitive object={scene} />
}

export default ContactScene
