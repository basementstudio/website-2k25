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

  const isContactOpen = useWorkerStore((state) => state.isContactOpen)
  const isClosing = useWorkerStore((state) => state.isClosing)
  const setIsContactOpen = useWorkerStore((state) => state.setIsContactOpen)
  const camera = useThree((state) => state.camera)

  const screenbone = gltf.nodes.Obj as Bone
  const screenboneMatrix = screenbone.matrixWorld.toArray()
  const screenCameraMatrix = camera.matrixWorld.toArray()

  // Send matrix updates every frame when contact is open
  useFrame(() => {
    if (isContactOpen && !isClosing) {
      self.postMessage({
        type: "update-screen-skinned-matrix",
        screenboneMatrix: screenbone.matrixWorld.toArray(),
        cameraMatrix: camera.matrixWorld.toArray()
      })
    }
  })

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
    // Listen to form updates from the worker
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
      handler.playAnimation("Outro-v2", {
        type: "transition",
        clampWhenFinished: true
      })
    } else if (isContactOpen) {
      handler.playAnimation("Intro.001", {
        type: "transition",
        clampWhenFinished: true,
        fadeInDuration: 0.05,
        onComplete: () => {
          self.postMessage({
            type: "update-screen-skinned-matrix",
            screenboneMatrix: screenboneMatrix,
            cameraMatrix: screenCameraMatrix
          })
          idleTimeRef.current = 0
        }
      })
    }
  }, [isContactOpen, isClosing])

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

      if (idleTimeRef.current > IDLE_TIMEOUT) {
        //playRandomIdleAnimation()
        idleTimeRef.current = 0
      }
    }
  })

  return (
    <>
      <group scale={6} ref={phoneGroupRef}>
        <primitive position-y={-0.05} object={gltf.scene} />
      </group>
    </>
  )
}

export default ContactScene
