import { useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AnimationMixer,
  Box3,
  Group,
  LoopRepeat,
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
  const phoneGroupRef = useRef<Group>(null)
  const updateFormData = useWorkerStore((state) => state.updateFormData)

  console.log(
    "[scene] all animations",
    gltf.animations.map((a) => a.name)
  )

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
        console.log("[ContactScene] Received form update:", e.data.formData)
        updateFormData(e.data.formData)
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [updateFormData])

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

        // TODO: use the global material
        // console.log(`Material for ${node.name}:`, {
        //   hasMap: "map" in oldMaterial && oldMaterial.map !== null,
        //   hasColor: "color" in oldMaterial,
        //   isTransparent: oldMaterial.transparent,
        //   opacity: oldMaterial.opacity
        // })

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

    const action = mixer.clipAction(gltf.animations[0])
    action.play()
    action.setLoop(LoopRepeat, 1)
    action.clampWhenFinished = true

    return () => {
      mixer.stopAllAction()
      animationMixerRef.current = null
    }
  }, [gltf, glass])

  useFrame((_, delta) => {
    animationMixerRef.current?.update(delta)

    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }
  })

  if (!screenMesh || !screenPosition || !screenScale) return null

  return (
    <>
      <RenderTexture
        isPlaying={true}
        fbo={renderTarget}
        useGlobalPointer={false}
        raycasterMesh={glass}
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
