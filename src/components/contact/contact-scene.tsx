import { useAnimations, useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Mesh,
  MeshBasicMaterial,
  LoopOnce,
  AnimationMixer,
  Group,
  Vector3,
  Bone
} from "three"

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const { scene, animations, nodes } = useGLTF(modelUrl)
  const { actions, mixer } = useAnimations(animations, scene)
  const mixerRef = useRef<AnimationMixer | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)

  const debugMeshRef = useRef<Mesh>(null)
  const phoneGroupRef = useRef<Group>(null)
  const idleTimeRef = useRef<number>(0)
  const tmp = new Vector3()

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
            self.postMessage({ type: "intro-complete" })
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
        map: "map" in oldMaterial ? oldMaterial.map : undefined
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
          // Instead of running outro directly, signal to run scale-down animation first
          self.postMessage({ type: "start-outro" })
        }
      }

      // Add handler for the new message type
      if (e.data.type === "run-outro-animation") {
        runOutro()
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [runIntro, runOutro, isAnimating, isContactOpen])

  const camera = useThree((state) => state.camera)

  useFrame((_, delta) => {
    if (isContactOpen) {
      idleTimeRef.current += delta

      const IDLE_TIMEOUT = Math.random() * 5 + 15

      const screenbone = nodes.Obj as Bone
      if (screenbone && debugMeshRef.current) {
        screenbone.getWorldPosition(tmp)
        tmp.add(new Vector3(-0.0342, 0.043, 0))
        debugMeshRef.current.position.copy(tmp)

        const screenPos = tmp.clone().project(camera)

        const normalizedScreenPos = {
          x: (screenPos.x + 1) / 2,
          y: (-screenPos.y + 1) / 2,
          z: screenPos.z
        }

        self.postMessage({
          type: "update-screen-skinned-matrix",
          screenPos: normalizedScreenPos,
          scale: 1 + idleTimeRef.current * 0.1
        })
      }

      if (idleTimeRef.current > IDLE_TIMEOUT) {
        //playRandomIdleAnimation()
        idleTimeRef.current = 0
      }
    }
  })

  return (
    <>
      <group scale={1} ref={phoneGroupRef} position={[0, 0, 0]}>
        <primitive object={scene} />
      </group>
      <mesh ref={debugMeshRef} renderOrder={2} visible={false}>
        <sphereGeometry args={[0.05, 32, 32]} />
        <meshBasicMaterial color="green" depthTest={false} transparent />
      </mesh>
    </>
  )
}

export default ContactScene
