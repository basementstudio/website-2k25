import { Environment, PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Container, Input, Root, Text } from "@react-three/uikit"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AnimationMixer,
  AnimationUtils,
  Box3,
  DoubleSide,
  LoopRepeat,
  Mesh,
  Vector3,
  WebGLRenderTarget
} from "three"

import { RenderTexture } from "../arcade-screen/render-texture"
import { screenMaterial } from "../arcade-screen/screen-material"

const PhoneScreenUI = ({ screenScale }: { screenScale?: Vector3 | null }) => {
  const aspect = screenScale ? screenScale.x / screenScale.y : 1

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={1} />
      <PerspectiveCamera
        manual
        makeDefault
        position={[0, 0, 8]}
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
          <Text fontSize={32} color="#ffffff" fontWeight="bold">
            hello there
          </Text>
          {/* <Input type="text" value="obi wanker nobi" /> */}
        </Container>
      </Root>
    </>
  )
}

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  console.log("[ContactScene] model url", modelUrl)
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

      screenMaterial.side = DoubleSide
      screenMaterial.needsUpdate = true
      screenMaterial.uniforms.map.value = renderTarget.texture
      screen.material = screenMaterial

      console.log("screen geometry:", {
        vertices: screen.geometry.attributes.position.count,
        normals: screen.geometry.attributes.normal?.count,
        uv: screen.geometry.attributes.uv?.count
      })
    }
  }, [gltf.scene, renderTarget.texture])

  useEffect(() => {
    if (!screenMesh) return

    const geometry = screenMesh.geometry
    const normals = geometry.attributes.normal
    if (normals) {
      for (let i = 0; i < normals.count; i++) {
        normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i))
      }
      normals.needsUpdate = true
      geometry.computeVertexNormals()
    }
  }, [screenMesh])

  // L-Idle
  // R-Idle
  // Buttons-1
  // Buttons-2
  // Buttons-3

  useEffect(() => {
    if (!gltf.scene || !gltf.animations.length) return

    // TODO: add a mix blend to the glass
    if (glass) {
      glass.visible = false
    }

    mixerRef.current = new AnimationMixer(gltf.scene)
    const mixer = mixerRef.current

    const baseAnim = gltf.animations.find((anim) => anim.name === "L-Idle")
    const secondAnim = gltf.animations.find((anim) => anim.name === "R-Idle")

    if (baseAnim && secondAnim) {
      const idleClip1 = AnimationUtils.subclip(
        baseAnim,
        "idle1",
        0,
        baseAnim.duration * 30,
        30
      )
      const idleClip2 = AnimationUtils.subclip(
        secondAnim,
        "idle2",
        0,
        secondAnim.duration * 30,
        30
      )

      const action1 = mixer.clipAction(idleClip1)
      const action2 = mixer.clipAction(idleClip2)

      action1.setLoop(LoopRepeat, Infinity)
      action2.setLoop(LoopRepeat, Infinity)

      action1.play()
      action2.play()
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
