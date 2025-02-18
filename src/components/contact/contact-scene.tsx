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
  PerspectiveCamera,
  SkinnedMesh,
  Vector2,
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

        // TODO: use global material?

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

    const enterAnimation = gltf.animations[0]
    const idleAnimation = gltf.animations.find((a) => a.name === "Iddle4")

    const enterAction = mixer.clipAction(enterAnimation)
    const idleAction = mixer.clipAction(idleAnimation!)

    idleAction.setLoop(LoopRepeat, Infinity)
    idleAction.clampWhenFinished = false

    enterAction.setLoop(LoopRepeat, 1)
    enterAction.clampWhenFinished = true

    const onAnimationFinished = (e: any) => {
      if (e.action === enterAction) {
        idleAction.play()
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

  useFrame((state, delta) => {
    animationMixerRef.current?.update(delta)

    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }

    // broadcast screen data
    if (
      screenMesh &&
      screenPosition &&
      state.camera instanceof PerspectiveCamera
    ) {
      const screenWorldPos = screenMesh.getWorldPosition(new Vector3())

      // const cameraMatrix = state.camera.matrixWorldInverse.clone()
      const cameraMatrix = state.camera.matrixWorld.clone()

      // mesh matrix
      const meshMatrix = screenMesh.matrixWorld.clone()

      // project position to screen space
      const tempV = screenWorldPos.clone()
      tempV.project(state.camera)

      // Convert to pixel coordinates
      const widthHalf = state.size.width / 2
      const heightHalf = state.size.height / 2
      const screenX = tempV.x * widthHalf + widthHalf
      const screenY = -tempV.y * heightHalf + heightHalf

      // distance from camera, 25 fov
      const distance = screenWorldPos.distanceTo(state.camera.position)
      const vFov = (state.camera.fov * Math.PI) / 180

      const scaleFactor = 1 / (2 * Math.tan(vFov / 2))
      const scale = distance * scaleFactor

      // Calculate dimensions based on the screen mesh's actual size
      const box = new Box3().setFromObject(screenMesh)
      const size = box.getSize(new Vector3())

      // Adjust viewport scaling based on FOV
      const width = size.x * state.viewport.width * scaleFactor
      const height = size.y * state.viewport.height * scaleFactor

      self.postMessage({
        type: "update-screen-data",
        position: new Vector2(screenX, screenY),
        dimensions: new Vector2(width, height),
        scale,
        distance,
        matrix: Array.from(meshMatrix.elements),
        cameraMatrix: Array.from(cameraMatrix.elements)
      })
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
