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
import PhoneScreenUI from "./ui/render-ui"

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const gltf = useGLTF(modelUrl)
  const animationMixerRef = useRef<AnimationMixer | null>(null)
  const phoneGroupRef = useRef<Group>(null)
  const idleTimeRef = useRef<number>(0)
  const currentIdleAnimationRef = useRef<AnimationAction | null>(null)

  const updateFormData = useWorkerStore((state) => state.updateFormData)
  const updateFocusedElement = useWorkerStore(
    (state) => state.updateFocusedElement
  )
  const isContactOpen = useWorkerStore((state) => state.isContactOpen)

  const [screenMesh, setScreenMesh] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
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
        console.log(
          "[ContactScene] Received update-contact-open:",
          e.data.isContactOpen
        )
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

    if (screen) {
      const box = new Box3().setFromObject(screen)
      const size = box.getSize(new Vector3())
      const center = box.getCenter(new Vector3())
      setScreenPosition(center)
      setScreenScale(size)

      screenMaterial.needsUpdate = true
      screenMaterial.uniforms.map.value = renderTarget.texture
      screenMaterial.uniforms.uRevealProgress = { value: 1.0 }
      screen.material = screenMaterial
    }
  }, [gltf.scene, renderTarget.texture, screenMaterial])

  useEffect(() => {
    if (!gltf.scene || !gltf.animations.length) return

    if (glass) {
      glass.visible = false
    }

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

    const enterAnimation = gltf.animations.find((a) => a.name === "Intro.001")

    if (!enterAnimation) {
      console.warn("Intro.001 animation not found")
      return
    }

    const enterAction = mixer.clipAction(enterAnimation)
    enterAction.setLoop(LoopOnce, 1)
    enterAction.clampWhenFinished = true
    enterAction.fadeIn(0.05)

    const onAnimationFinished = (e: any) => {
      if (e.action === enterAction) {
        idleTimeRef.current = 0
      }
    }

    enterAction.play()
    mixer.addEventListener("finished", onAnimationFinished)

    return () => {
      mixer.stopAllAction()
      mixer.removeEventListener("finished", onAnimationFinished)
      animationMixerRef.current = null
    }
  }, [gltf, glass])

  const playRandomIdleAnimation = () => {
    if (!animationMixerRef.current) return

    const idleAnimations = ["antena", "antena.003", "ruedita"]
    const randomAnim =
      idleAnimations[Math.floor(Math.random() * idleAnimations.length)]

    const animation = gltf.animations.find((a) => a.name === randomAnim)
    if (!animation) return

    if (currentIdleAnimationRef.current) {
      currentIdleAnimationRef.current.fadeOut(0.5)
    }

    const action = animationMixerRef.current.clipAction(animation)
    action.setLoop(LoopOnce, 1)
    action.clampWhenFinished = true
    action.reset()
    action.fadeIn(0.5)
    action.play()

    currentIdleAnimationRef.current = action
  }

  useFrame((state, delta) => {
    if (!isContactOpen) return

    animationMixerRef.current?.update(delta)

    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }

    idleTimeRef.current += delta

    const IDLE_TIMEOUT = Math.random() * 5 + 15

    if (idleTimeRef.current > IDLE_TIMEOUT) {
      playRandomIdleAnimation()
      idleTimeRef.current = 0
    }
  })

  if (!screenMesh || !screenPosition || !screenScale) return null

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
