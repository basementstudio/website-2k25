import { useAnimations, useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bone,
  Group,
  LoopOnce,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3
} from "three"

import { ANIMATION_TYPES } from "./contact.interface"

const IDLE_ANIMATIONS = [ANIMATION_TYPES.RUEDITA, ANIMATION_TYPES.ANTENA]

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const { scene, animations, nodes } = useGLTF(modelUrl)
  const { actions, mixer } = useAnimations(animations, scene)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationState, setAnimationState] = useState(ANIMATION_TYPES.IDLE)

  const debugMeshRef = useRef<Mesh>(null)
  const phoneGroupRef = useRef<Group>(null)
  const idleTimeRef = useRef<number>(0)
  const tmp = useMemo(() => new Vector3(), [])
  const camera = useThree((state) => state.camera)

  // animation runners
  const runAnimation = useCallback((type: string) => {
    setAnimationState(type)
    setIsAnimating(true)

    if (type === ANIMATION_TYPES.INTRO && phoneGroupRef.current) {
      phoneGroupRef.current.visible = true
    }
  }, [])

  const runRandomIdleAnimation = useCallback(() => {
    if (isAnimating) return
    const animation =
      IDLE_ANIMATIONS[Math.floor(Math.random() * IDLE_ANIMATIONS.length)]

    // Notify the main thread that an animation is starting
    self.postMessage({ type: "animation-starting" })

    runAnimation(animation)
  }, [isAnimating, runAnimation])

  // handle animations
  useEffect(() => {
    if (!actions || !mixer || animationState === ANIMATION_TYPES.IDLE) {
      setIsAnimating(
        animationState === ANIMATION_TYPES.IDLE ? false : isAnimating
      )

      return
    }

    const animationMap = {
      [ANIMATION_TYPES.INTRO]: "Intro",
      [ANIMATION_TYPES.BUTTON]: "Button",
      [ANIMATION_TYPES.OUTRO]: "Outro",
      [ANIMATION_TYPES.RUEDITA]: "Ruedita",
      [ANIMATION_TYPES.ANTENA]: "Antena"
    }

    const actionName = animationMap[animationState]
    const action = actions[actionName]

    if (!action) return

    mixer.stopAllAction()
    action.reset()
    action.setLoop(LoopOnce, 1)
    action.clampWhenFinished = true

    if (animationState === ANIMATION_TYPES.OUTRO) {
      action.timeScale = 1.5
    } else if (
      [ANIMATION_TYPES.RUEDITA, ANIMATION_TYPES.ANTENA].includes(animationState)
    ) {
      action.timeScale = 1.0

      if (animationState === ANIMATION_TYPES.RUEDITA) {
        self.postMessage({ type: "ruedita-animation-start" })
      } else if (animationState === ANIMATION_TYPES.ANTENA) {
        self.postMessage({ type: "antena-animation-start" })
      }
    } else {
      action.timeScale = 1.2

      if (animationState === ANIMATION_TYPES.BUTTON) {
        self.postMessage({ type: "button-animation-start" })
      }
    }

    const onAnimationFinished = (e: any) => {
      if (e.action !== action) return

      setIsAnimating(false)
      setAnimationState(ANIMATION_TYPES.IDLE)

      if (animationState === ANIMATION_TYPES.INTRO) {
        setIsContactOpen(true)
        self.postMessage({ type: "intro-complete" })

        const screenbone = nodes.Obj as Bone
        if (screenbone && camera) {
          const tmp = new Vector3()
          screenbone.getWorldPosition(tmp)
          tmp.add(new Vector3(-0.0342, 0.043, 0))

          const screenPos = tmp.clone().project(camera)
          const normalizedScreenPos = {
            x: (screenPos.x + 1) / 2,
            y: (-screenPos.y + 1) / 2,
            z: screenPos.z
          }

          self.postMessage({
            type: "update-screen-skinned-matrix",
            screenPos: normalizedScreenPos,
            scale: 1
          })
        }
      } else if (animationState === ANIMATION_TYPES.OUTRO) {
        setIsContactOpen(false)
        self.postMessage({ type: "outro-complete" })
      } else if (animationState === ANIMATION_TYPES.RUEDITA) {
        self.postMessage({ type: "ruedita-animation-complete" })
        self.postMessage({ type: "animation-complete" })
      } else if (animationState === ANIMATION_TYPES.ANTENA) {
        self.postMessage({ type: "antena-animation-complete" })
        self.postMessage({ type: "animation-complete" })
      } else if (animationState === ANIMATION_TYPES.BUTTON) {
        self.postMessage({ type: "button-animation-complete" })
      }
    }

    mixer.addEventListener("finished", onAnimationFinished)
    action.play()

    return () => mixer.removeEventListener("finished", onAnimationFinished)
  }, [animationState, actions, mixer, isAnimating, nodes, camera])

  const calculateAndSendScreenDimensions = useCallback(() => {
    if (!scene) return

    const screenObject = scene.getObjectByName("SCREEN")
    if (!(screenObject && screenObject instanceof Mesh)) return

    screenObject.geometry.computeBoundingBox()
    const bbox = screenObject.geometry.boundingBox
    if (!bbox) return

    const width = bbox.max.x - bbox.min.x
    const height = bbox.max.y - bbox.min.y

    const perspCamera = camera as PerspectiveCamera
    const fov = (perspCamera.fov || 8.5) * (Math.PI / 180)
    const distance = Math.abs(
      camera.position.z - (screenObject.position.z || 0)
    )
    const workerContext = self as any
    const windowHeight =
      workerContext.windowDimensions?.height || window.innerHeight || 1080

    let pixelsPerUnit = 0
    try {
      pixelsPerUnit =
        distance > 0 && fov > 0
          ? windowHeight / (2 * Math.tan(fov / 2) * distance)
          : 300
    } catch {
      pixelsPerUnit = 300
    }

    const pixelWidth = width * pixelsPerUnit + 40
    const pixelHeight = height * pixelsPerUnit + 20

    const dimensions = {
      width: 580,
      height: 350
    }

    if (
      !isNaN(pixelWidth) &&
      !isNaN(pixelHeight) &&
      pixelWidth > 0 &&
      pixelHeight > 0 &&
      pixelWidth < 2000 &&
      pixelHeight < 2000
    ) {
      dimensions.width = Math.round(pixelWidth)
      dimensions.height = Math.round(pixelHeight)
    } else if (width > 0 && height > 0 && !isNaN(width) && !isNaN(height)) {
      const aspectRatio = width / height
      dimensions.height =
        aspectRatio > 1
          ? Math.round(dimensions.width / aspectRatio)
          : dimensions.height
      dimensions.width =
        aspectRatio <= 1
          ? Math.round(dimensions.height * aspectRatio)
          : dimensions.width
    }

    self.postMessage({
      type: "screen-dimensions",
      dimensions
    })
  }, [scene, camera])

  // message handler
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const { type, isContactOpen: newIsOpen } = e.data

      if (type === "update-contact-open") {
        if (isAnimating) {
          self.postMessage({
            type: "animation-rejected",
            currentState: isContactOpen
          })
          return
        }

        if (newIsOpen === isContactOpen) return

        if (newIsOpen && !isContactOpen) {
          runAnimation(ANIMATION_TYPES.INTRO)
        } else if (!newIsOpen && isContactOpen) {
          self.postMessage({ type: "start-outro" })
        }
      } else if (type === "run-outro-animation") {
        runAnimation(ANIMATION_TYPES.OUTRO)
      } else if (type === "submit-clicked") {
        runAnimation(ANIMATION_TYPES.BUTTON)
      } else if (type === "window-resize") {
        const workerContext = self as any
        workerContext.windowDimensions = e.data.windowDimensions
        calculateAndSendScreenDimensions()

        if (isContactOpen && nodes.Obj && camera) {
          const screenbone = nodes.Obj as Bone
          const tmp = new Vector3()
          screenbone.getWorldPosition(tmp)
          tmp.add(new Vector3(-0.0342, 0.043, 0))

          const screenPos = tmp.clone().project(camera)
          const normalizedScreenPos = {
            x: (screenPos.x + 1) / 2,
            y: (-screenPos.y + 1) / 2,
            z: screenPos.z
          }

          self.postMessage({
            type: "update-screen-skinned-matrix",
            screenPos: normalizedScreenPos,
            scale: 1
          })
        }
      } else if (
        ["scale-animation-complete", "scale-down-animation-complete"].includes(
          type
        )
      ) {
        self.postMessage({ type })
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [
    isAnimating,
    isContactOpen,
    runAnimation,
    calculateAndSendScreenDimensions
  ])

  // add materials
  useEffect(() => {
    if (!scene || !animations.length) return
    calculateAndSendScreenDimensions()

    scene.traverse((node) => {
      node.frustumCulled = false

      if (node instanceof Mesh && node.material && node.name !== "SCREEN") {
        const oldMaterial = node.material
        const basicMaterial = new MeshBasicMaterial({
          color: "color" in oldMaterial ? oldMaterial.color : undefined,
          map: "map" in oldMaterial ? oldMaterial.map : undefined,
          opacity: "opacity" in oldMaterial ? oldMaterial.opacity : undefined
        })
        node.material = basicMaterial
      }
    })
  }, [scene, animations, calculateAndSendScreenDimensions])

  useFrame((_, delta) => {
    if (!isContactOpen || isAnimating) return

    idleTimeRef.current += delta
    const IDLE_TIMEOUT = Math.random() * 5 + 15

    const screenbone = nodes.Obj as Bone
    if (screenbone && debugMeshRef.current) {
      screenbone.getWorldPosition(tmp)
      tmp.add(new Vector3(-0.0342, 0.043, 0))
      debugMeshRef.current.position.copy(tmp)
    }

    if (idleTimeRef.current > IDLE_TIMEOUT) {
      runRandomIdleAnimation()
      idleTimeRef.current = 0
    }
  })

  return (
    <>
      <group
        scale={1}
        ref={phoneGroupRef}
        position={[0, -0.025, 0]}
        visible={isAnimating || isContactOpen}
      >
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
