import { useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AnimationMixer,
  Bone,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  SkinnedMesh,
  Vector3
} from "three"

import { useWorkerStore } from "@/workers/contact-worker"

import { PhoneAnimationHandler } from "./contact-anims"

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const gltf = useGLTF(modelUrl)
  const animationMixerRef = useRef<AnimationMixer | null>(null)
  const animationHandlerRef = useRef<PhoneAnimationHandler | null>(null)
  const phoneGroupRef = useRef<Group>(null)
  const idleTimeRef = useRef<number>(0)
  const lastPositionRef = useRef<Vector3 | null>(null)

  const [screenMatrix, setScreenMatrix] = useState<Matrix4>(new Matrix4())

  const debugMeshRef = useRef<Mesh>(null)

  const tmp = new Vector3()

  const isContactOpen = useWorkerStore((state) => state.isContactOpen)
  const isClosing = useWorkerStore((state) => state.isClosing)
  const setIsContactOpen = useWorkerStore((state) => state.setIsContactOpen)
  const camera = useThree((state) => state.camera)
  const { mixer, handler } = useMemo(() => {
    if (!gltf.scene || !gltf.animations.length)
      return { mixer: null, handler: null }

    const mixer = new AnimationMixer(gltf.scene)
    const handler = new PhoneAnimationHandler(mixer, gltf.animations)

    return { mixer, handler }
  }, [gltf.scene, gltf.animations])

  useEffect(() => {
    animationMixerRef.current = mixer
    animationHandlerRef.current = handler

    return () => {
      if (mixer) mixer.stopAllAction()
      animationMixerRef.current = null
      animationHandlerRef.current = null
    }
  }, [mixer, handler])

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "update-contact-open") {
        setIsContactOpen(e.data.isContactOpen)
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [setIsContactOpen])

  useEffect(() => {
    if (!gltf.scene || !gltf.animations.length) return

    gltf.scene.traverse((node) => {
      node.frustumCulled = false

      if (node instanceof Mesh && node.material && node.name !== "SCREEN") {
        const oldMaterial = node.material
        const basicMaterial = new MeshBasicMaterial()

        if ("color" in oldMaterial) basicMaterial.color = oldMaterial.color
        if ("map" in oldMaterial) basicMaterial.map = oldMaterial.map
        if ("transparent" in oldMaterial)
          basicMaterial.transparent = oldMaterial.transparent
        if ("opacity" in oldMaterial)
          basicMaterial.opacity = oldMaterial.opacity
        node.material = basicMaterial
      }
    })
  }, [gltf])

  useEffect(() => {
    const handler = animationHandlerRef.current
    if (!handler) return

    if (phoneGroupRef.current && lastPositionRef.current) {
      phoneGroupRef.current.position.copy(lastPositionRef.current)
    }

    if (isClosing) {
      self.postMessage({
        type: "scale-type",
        scale: "scale-down"
      })

      setTimeout(() => {
        handler.playAnimation("Outro-v2", {
          type: "transition",
          clampWhenFinished: true
        })
      }, 550)
    } else if (isContactOpen) {
      handler.playAnimation("Intro.001", {
        type: "transition",
        clampWhenFinished: true,
        fadeInDuration: 0.05,
        onComplete: () => {
          const screen = gltf.scene.children[0].getObjectByName(
            "SCREEN"
          ) as SkinnedMesh
          const screenbone = gltf.nodes.Obj as Bone

          if (!debugMeshRef.current) return
          screenbone.getWorldPosition(tmp)
          tmp.add(new Vector3(0, 0.2, 0))
          debugMeshRef.current.position.copy(tmp)

          const screenPos = tmp.clone().project(camera)

          const normalizedScreenPos = {
            x: (screenPos.x + 1) / 2,
            y: (-screenPos.y + 1) / 2,
            z: screenPos.z
          }

          self.postMessage({
            type: "scale-type",
            scale: "scale-up"
          })
          self.postMessage({
            type: "update-screen-skinned-matrix",
            screenboneMatrix: screenbone.matrixWorld.toArray(),
            cameraMatrix: camera.matrixWorld.toArray(),
            screenSize: {
              width:
                screen.geometry.boundingBox?.getSize(new Vector3())?.x || 0,
              height:
                screen.geometry.boundingBox?.getSize(new Vector3())?.y || 0
            },
            screenPos: normalizedScreenPos
          })

          self.postMessage({
            type: "intro-complete"
          })

          idleTimeRef.current = 0
        }
      })
    }
  }, [isContactOpen, isClosing])

  useEffect(() => {
    if (!gltf.scene || !gltf.animations.length) return

    const screenbone = gltf.nodes.Obj as Bone
    setScreenMatrix(screenbone.matrixWorld)
  }, [gltf])

  const playRandomIdleAnimation = () => {
    const handler = animationHandlerRef.current
    if (!handler || isClosing || !isContactOpen) return

    const idleAnimations = ["antena", "antena.003", "ruedita"] as const
    const randomAnim =
      idleAnimations[Math.floor(Math.random() * idleAnimations.length)]

    handler.playAnimation(randomAnim, {
      type: "idle",
      clampWhenFinished: true,
      loop: false,
      weight: 1,
      fadeInDuration: 0.2,
      fadeOutDuration: 0.2
    })
  }

  useFrame((_, delta) => {
    const handler = animationHandlerRef.current
    if (!handler) return

    handler.update(delta)

    if (isContactOpen && !isClosing) {
      idleTimeRef.current += delta

      const IDLE_TIMEOUT = Math.random() * 5 + 15

      const screenbone = gltf.nodes.Obj as Bone
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

        const scale = 1 + idleTimeRef.current * 0.1

        self.postMessage({
          type: "update-screen-skinned-matrix",
          screenPos: normalizedScreenPos,
          scale: scale
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
      <mesh ref={debugMeshRef} renderOrder={2} visible={true}>
        <sphereGeometry args={[0.05, 32, 32]} />
        <meshBasicMaterial color="green" depthTest={false} transparent />
      </mesh>
      <group scale={1} ref={phoneGroupRef} position={[0, 0, 0]}>
        <primitive object={gltf.scene} />
      </group>
    </>
  )
}

export default ContactScene
