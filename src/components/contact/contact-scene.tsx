import { useAnimations, useGLTF } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Mesh,
  MeshBasicMaterial,
  LoopOnce,
  Group,
  Vector3,
  Bone,
  PerspectiveCamera
} from "three"

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const { scene, animations, nodes } = useGLTF(modelUrl)
  const { actions, mixer } = useAnimations(animations, scene)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationState, setAnimationState] = useState<
    "idle" | "intro" | "button" | "outro" | "ruedita" | "antena"
  >("idle")

  const idleAnimations = ["ruedita", "antena"]

  const debugMeshRef = useRef<Mesh>(null)
  const phoneGroupRef = useRef<Group>(null)
  const idleTimeRef = useRef<number>(0)
  const tmp = new Vector3()
  const camera = useThree((state) => state.camera)

  // run animations
  const runIntro = useCallback(() => {
    if (mixer) {
      mixer.stopAllAction()
    }
    if (phoneGroupRef.current) {
      phoneGroupRef.current.visible = true
    }
    setAnimationState("intro")
    setIsAnimating(true)
  }, [mixer])

  const runOutro = useCallback(() => {
    setAnimationState("outro")
    setIsAnimating(true)
  }, [])

  const runButtonClick = useCallback(() => {
    setAnimationState("button")
    setIsAnimating(true)
  }, [])

  const runRuedita = useCallback(() => {
    setAnimationState("ruedita")
    setIsAnimating(true)
  }, [])

  const runAntena = useCallback(() => {
    setAnimationState("antena")
    setIsAnimating(true)
  }, [])

  const runRandomIdleAnimation = useCallback(() => {
    if (isAnimating) return

    const randomIndex = Math.floor(Math.random() * idleAnimations.length)
    const animation = idleAnimations[randomIndex]

    if (animation === "ruedita") {
      runRuedita()
    } else if (animation === "antena") {
      runAntena()
    }
  }, [runRuedita, runAntena, isAnimating])

  useEffect(() => {
    if (!actions || !mixer) return

    if (animationState === "idle") {
      setIsAnimating(false)
      return
    }

    const animationMap = {
      intro: "Intro.001",
      button: "Button",
      outro: "Outro-v2",
      ruedita: "ruedita",
      antena: "antena.003"
    }

    const actionName = animationMap[animationState]
    const action = actions[actionName]

    if (action) {
      mixer.stopAllAction()

      if (animationState === "intro") {
        action.reset()
        action.setLoop(LoopOnce, 1)
        action.clampWhenFinished = true
        action.timeScale = 1.2
      } else {
        action.reset()
        action.setLoop(LoopOnce, 1)
        action.clampWhenFinished = true

        if (animationState === "outro") {
          action.timeScale = 1.5
        } else if (
          animationState === "ruedita" ||
          animationState === "antena"
        ) {
          action.timeScale = 1.0
        } else {
          action.timeScale = 1.2
        }
      }

      const cleanupListeners = () => {
        mixer.removeEventListener("finished", onAnimationFinished)
      }

      const onAnimationFinished = (e: any) => {
        if (e.action !== action) return

        setIsAnimating(false)
        setAnimationState("idle")

        if (animationState === "intro") {
          setIsContactOpen(true)
          self.postMessage({ type: "intro-complete" })
        } else if (animationState === "outro") {
          setIsContactOpen(false)
          self.postMessage({ type: "outro-complete" })
        }

        cleanupListeners()
      }

      mixer.addEventListener("finished", onAnimationFinished)
      action.play()

      // Clean up function
      return cleanupListeners
    }
  }, [animationState, actions, mixer])

  // handle open and close
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
          runIntro()
        } else if (!newIsOpen && isContactOpen) {
          self.postMessage({ type: "start-outro" })
        }
      } else if (type === "run-outro-animation") {
        runOutro()
      } else if (
        ["scale-animation-complete", "scale-down-animation-complete"].includes(
          type
        )
      ) {
        self.postMessage({ type })
      } else if (type === "submit-clicked") {
        runButtonClick()
      } else if (type === "window-resize") {
        // Recalculate screen dimensions when window is resized
        calculateAndSendScreenDimensions()
      }
    }

    self.addEventListener("message", handleMessage)
    return () => self.removeEventListener("message", handleMessage)
  }, [runIntro, runOutro, isAnimating, isContactOpen, runButtonClick])

  // Function to calculate and send screen dimensions
  const calculateAndSendScreenDimensions = useCallback(() => {
    if (!scene) return
    const screenObject = scene.getObjectByName("SCREEN")
    if (!(screenObject && screenObject instanceof Mesh)) return

    // Get the screen's bounding box
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

    // Use safe calculation with fallbacks
    let pixelsPerUnit = 0
    try {
      if (distance > 0 && fov > 0) {
        pixelsPerUnit = windowHeight / (2 * Math.tan(fov / 2) * distance)
      } else {
        pixelsPerUnit = 300
      }
    } catch (e) {
      pixelsPerUnit = 300
    }

    const pixelWidth = width * pixelsPerUnit
    const pixelHeight = height * pixelsPerUnit

    if (
      !isNaN(pixelWidth) &&
      !isNaN(pixelHeight) &&
      pixelWidth > 0 &&
      pixelHeight > 0 &&
      pixelWidth < 2000 &&
      pixelHeight < 2000
    ) {
      self.postMessage({
        type: "screen-dimensions",
        dimensions: {
          width: Math.round(pixelWidth),
          height: Math.round(pixelHeight)
        }
      })
    } else {
      console.error("Invalid screen dimensions calculated:", {
        pixelWidth,
        pixelHeight
      })

      let fallbackWidth = 580
      let fallbackHeight = 350

      if (width > 0 && height > 0 && !isNaN(width) && !isNaN(height)) {
        const aspectRatio = width / height
        if (aspectRatio > 1) {
          fallbackHeight = Math.round(fallbackWidth / aspectRatio)
        } else {
          fallbackWidth = Math.round(fallbackHeight * aspectRatio)
        }
      }

      self.postMessage({
        type: "screen-dimensions",
        dimensions: {
          width: fallbackWidth,
          height: fallbackHeight
        }
      })
    }
  }, [scene, camera])

  // add materials
  useEffect(() => {
    if (!scene || !animations.length) return
    calculateAndSendScreenDimensions()

    scene.traverse((node) => {
      node.frustumCulled = false

      if (node instanceof Mesh && node.material && node.name !== "SCREEN") {
        const oldMaterial = node.material
        const basicMaterial = new MeshBasicMaterial()

        if ("color" in oldMaterial) basicMaterial.color = oldMaterial.color
        if ("map" in oldMaterial) basicMaterial.map = oldMaterial.map
        if ("opacity" in oldMaterial)
          basicMaterial.opacity = oldMaterial.opacity
        node.material = basicMaterial
      }
    })
  }, [scene, animations, calculateAndSendScreenDimensions])

  useFrame((_, delta) => {
    if (isContactOpen && !isAnimating) {
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
        runRandomIdleAnimation()
        idleTimeRef.current = 0
      }
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
