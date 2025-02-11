import { Environment, PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Container, Root, Text } from "@react-three/uikit"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AnimationMixer,
  Box3,
  LoopRepeat,
  Mesh,
  Vector3,
  WebGLRenderTarget
} from "three"

import { RenderTexture } from "../arcade-screen/render-texture"
import { screenMaterial } from "../arcade-screen/screen-material"

type PhoneAnimationName =
  | "L-IN"
  | "R-IN"
  | "L-Idle"
  | "R-Idle"
  | "Buttons-1"
  | "Buttons-2"
  | "Buttons-3"

const PhoneScreenUI = ({ screenScale }: { screenScale?: Vector3 | null }) => {
  const aspect = screenScale ? screenScale.x / screenScale.y : 1

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={1} />
      <PerspectiveCamera
        manual
        makeDefault
        position={[0, 0, 15]}
        rotation={[0, 0, Math.PI]}
        aspect={aspect}
      />
      <Root>
        <Container
          width="100%"
          height="100%"
          backgroundColor="#000000"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Text fontSize={32} color="white" fontWeight="bold">
            basement 2k25
          </Text>
        </Container>
      </Root>
    </>
  )
}

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const gltf = useGLTF(modelUrl)
  const mixerRef = useRef<AnimationMixer | null>(null)

  const [screenMesh, setScreenMesh] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)

  const glass = gltf.scene.getObjectByName("GLASS") as Mesh | undefined

  const renderTarget = useMemo(() => new WebGLRenderTarget(2024, 2024), [])

  useEffect(() => {
    const screen = gltf.scene.getObjectByName("SCREEN") as Mesh
    setScreenMesh(screen)

    if (screen) {
      const box = new Box3().setFromObject(screen)
      const size = box.getSize(new Vector3())
      const center = box.getCenter(new Vector3())
      setScreenPosition(center)
      setScreenScale(size)

      screenMaterial.needsUpdate = true
      screenMaterial.uniforms.map.value = renderTarget.texture
      screen.material = screenMaterial
    }
  }, [gltf.scene, renderTarget.texture])

  useEffect(() => {
    if (!gltf.scene || !gltf.animations.length) return

    // TODO: add a mix blend to the glass
    if (glass) {
      glass.visible = false
    }

    mixerRef.current = new AnimationMixer(gltf.scene)
    const mixer = mixerRef.current

    const leftIdle = gltf.animations.find(
      (anim) => anim.name === ("L-Idle" as PhoneAnimationName)
    )
    const rightIdle = gltf.animations.find(
      (anim) => anim.name === ("R-Idle" as PhoneAnimationName)
    )

    if (leftIdle && rightIdle) {
      const leftIdleAction = mixer.clipAction(leftIdle)
      const rightIdleAction = mixer.clipAction(rightIdle)

      leftIdleAction.setLoop(LoopRepeat, Infinity)
      rightIdleAction.setLoop(LoopRepeat, Infinity)

      leftIdleAction.play()
      rightIdleAction.play()
    }
  }, [gltf, glass])

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }
  })

  if (!screenMesh || !screenPosition || !screenScale) return null

  return (
    <>
      <Environment environmentIntensity={0.25} preset="studio" />
      <group scale={8}>
        <primitive position-y={-0.1} object={gltf.scene} />
      </group>
      <RenderTexture
        isPlaying={true}
        fbo={renderTarget}
        useGlobalPointer={false}
        raycasterMesh={screenMesh}
      >
        <PhoneScreenUI screenScale={screenScale} />
      </RenderTexture>
    </>
  )
}

export default ContactScene
