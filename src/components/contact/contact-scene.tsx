import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AnimationAction,
  AnimationMixer,
  Box3,
  Group,
  LoopOnce,
  Mesh,
  MeshBasicMaterial,
  SkinnedMesh,
  Vector3,
  WebGLRenderTarget
} from "three"

import { useWorkerStore } from "@/workers/contact-worker"

import { RenderTexture } from "../arcade-screen/render-texture"
import { createScreenMaterial } from "../arcade-screen/screen-material"
import { PhoneAnimationHandler } from "./contact-anims"
import PhoneScreenUI from "./ui/render-ui"

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const gltf = useGLTF(modelUrl)
  const animationMixerRef = useRef<AnimationMixer | null>(null)
  const animationHandlerRef = useRef<PhoneAnimationHandler | null>(null)
  const phoneGroupRef = useRef<Group>(null)
  const idleTimeRef = useRef<number>(0)

  console.log(gltf.animations)

  const updateFormData = useWorkerStore((state) => state.updateFormData)
  const updateFocusedElement = useWorkerStore(
    (state) => state.updateFocusedElement
  )
  const isContactOpen = useWorkerStore((state) => state.isContactOpen)
  const isClosing = useWorkerStore((state) => state.isClosing)

  const [screenMesh, setScreenMesh] = useState<Mesh | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)

  const glass = gltf.scene.children[0].getObjectByName("GLASS") as
    | Mesh
    | undefined

  const renderTarget = useMemo(() => new WebGLRenderTarget(2024, 2024), [])
  const screenMaterial = useMemo(() => createScreenMaterial(), [])

  useEffect(() => {
    // Listen to form updates from the worker
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === "update-form") {
        updateFormData(e.data.formData)
        idleTimeRef.current = 0
      } else if (e.data.type === "update-focus") {
        updateFocusedElement(e.data.focusedElement, e.data.cursorPosition)
      } else if (e.data.type === "update-contact-open") {
        useWorkerStore.getState().setIsContactOpen(e.data.isContactOpen)
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [updateFormData, updateFocusedElement])

  useEffect(() => {
    const screen = gltf.scene.children[0].getObjectByName(
      "SCREEN"
    ) as SkinnedMesh

    setScreenMesh(screen)

    if (glass) {
      glass.visible = false
    }

    if (screen) {
      const box = new Box3().setFromObject(screen)
      const size = box.getSize(new Vector3())
      setScreenScale(size)

      screenMaterial.needsUpdate = true
      screenMaterial.uniforms.map.value = renderTarget.texture
      screenMaterial.uniforms.uRevealProgress = { value: 1.0 }
      screen.material = screenMaterial
    }
  }, [gltf.scene, renderTarget.texture, screenMaterial, glass])

  useEffect(() => {
    if (!gltf.scene || !gltf.animations.length) return

    gltf.scene.traverse((node) => {
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

    const mixer = new AnimationMixer(gltf.scene)
    animationMixerRef.current = mixer
    animationHandlerRef.current = new PhoneAnimationHandler(
      mixer,
      gltf.animations
    )

    return () => {
      mixer.stopAllAction()
      animationMixerRef.current = null
      animationHandlerRef.current = null
    }
  }, [gltf])

  // Handle animation states
  useEffect(() => {
    const handler = animationHandlerRef.current
    if (!handler) return

    if (isClosing) {
      const action = handler.playAnimation("Outro-v2", {
        type: "transition",
        clampWhenFinished: true,
        fadeInDuration: 0.05,
        onComplete: () => {
          console.log("Outro animation complete")
        }
      })
    } else if (isContactOpen) {
      // sometimes positioning is off when re-entering the scene
      phoneGroupRef.current?.position.set(0, -0.05, 0)

      const action = handler.playAnimation("Intro.001", {
        type: "transition",
        clampWhenFinished: true,
        fadeInDuration: 0.05,
        onComplete: () => {
          idleTimeRef.current = 0
        }
      })
    } else {
      handler.stopAllAnimations(0.05)
    }
  }, [isContactOpen, isClosing])

  const playRandomIdleAnimation = () => {
    const handler = animationHandlerRef.current
    if (!handler) return

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

  useFrame((state, delta) => {
    const handler = animationHandlerRef.current
    if (!handler) return

    handler.update(delta)

    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }

    if (isContactOpen && !isClosing) {
      idleTimeRef.current += delta

      const IDLE_TIMEOUT = Math.random() * 5 + 15

      if (idleTimeRef.current > IDLE_TIMEOUT) {
        playRandomIdleAnimation()
        idleTimeRef.current = 0
      }
    }
  })

  if (!screenMesh || !screenScale) return null

  return (
    <>
      <RenderTexture
        isPlaying={true}
        fbo={renderTarget}
        useGlobalPointer={false}
        raycasterMesh={screenMesh}
      >
        <PhoneScreenUI screenScale={screenScale} />
      </RenderTexture>

      <group scale={6} ref={phoneGroupRef}>
        <primitive position-y={-0.05} object={gltf.scene} />
      </group>
    </>
  )
}

export default ContactScene
