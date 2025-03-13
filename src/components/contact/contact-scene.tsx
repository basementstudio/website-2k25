import { useAnimations, useGLTF } from "@react-three/drei"
import { useCallback, useEffect, useRef, useState } from "react"
import { Mesh, MeshBasicMaterial, LoopOnce, AnimationMixer } from "three"

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const { scene, animations } = useGLTF(modelUrl)
  const { actions, mixer } = useAnimations(animations, scene)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)

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

      setIsAnimating(true)
      const anim = actions[animName]
      anim.reset()
      anim.clampWhenFinished = true
      anim.loop = LoopOnce
      anim.play()

      // notify parent when animation is complete
      if (animName === "Outro-v2") {
        const onAnimationFinished = () => {
          self.postMessage({ type: "outro-complete" })
          setIsAnimating(false)
          setIsContactOpen(false)
          mixer.removeEventListener("finished", onAnimationFinished)
        }
        mixer.addEventListener("finished", onAnimationFinished)
      } else {
        const onAnimationFinished = () => {
          setIsAnimating(false)
          if (animName === "Intro.001") {
            setIsContactOpen(true)
          }
          mixer.removeEventListener("finished", onAnimationFinished)
        }
        mixer.addEventListener("finished", onAnimationFinished)
      }
    },
    [actions, mixer]
  )

  const runIntro = useCallback(() => {
    playAnimation("Intro.001", "Outro-v2")
  }, [playAnimation])

  const runOutro = useCallback(() => {
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
        if (isAnimating) {
          self.postMessage({
            type: "animation-rejected",
            currentState: isContactOpen
          })
          return
        }

        if (e.data.isContactOpen === isContactOpen) return

        if (e.data.isContactOpen && !isContactOpen) {
          runIntro()
        } else if (!e.data.isContactOpen && isContactOpen) {
          runOutro()
        }
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [runIntro, runOutro, isAnimating, isContactOpen])

  return <primitive object={scene} />
}

export default ContactScene
