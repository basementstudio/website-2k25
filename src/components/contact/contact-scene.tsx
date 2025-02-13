import { PerspectiveCamera, useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import {
  Container,
  DefaultProperties,
  FontFamilyProvider,
  Input,
  Root,
  Text
} from "@react-three/uikit"
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

import { RenderTexture } from "../arcade-screen/render-texture"
import { createScreenMaterial } from "../arcade-screen/screen-material"
import { PhoneAnimationHandler } from "./contact-anims"

const COLORS_THEME = {
  primary: "#FF4D00",
  black: "#0D0D0D"
}

const PhoneScreenUI = ({ screenScale }: { screenScale?: Vector3 | null }) => {
  const aspect = screenScale ? screenScale.x / screenScale.y : 1

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <PerspectiveCamera
        manual
        makeDefault
        position={[0, 0, 4]}
        rotation={[0, 0, Math.PI]}
        aspect={aspect}
      />
      <Root
        width={578}
        height={360}
        transformScaleX={-1}
        backgroundColor={COLORS_THEME.black}
        positionType="relative"
        display="flex"
        flexDirection="column"
      >
        <FontFamilyProvider
          ffflauta={{
            normal: "/fonts/ffflauta.json"
          }}
        >
          <DefaultProperties
            fontFamily={"ffflauta"}
            fontSize={13}
            fontWeight={"normal"}
            color={COLORS_THEME.primary}
          >
            <Text
              fontSize={13}
              color={COLORS_THEME.primary}
              fontWeight="normal"
              positionType="absolute"
              positionTop={16}
              positionLeft={28}
              paddingX={8}
              backgroundColor={COLORS_THEME.black}
              zIndexOffset={10}
            >
              FILL IN THE FORM
            </Text>
            <Container
              width="100%"
              height="90%"
              backgroundColor="#000000"
              display="flex"
              flexDirection="column"
              justifyContent="flex-start"
              alignItems="center"
              padding={16}
            >
              <Container
                width="100%"
                height="100%"
                backgroundColor="#000000"
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="center"
                borderColor="#ffffff"
                borderWidth={1}
              >
                <Container
                  width="100%"
                  backgroundColor={COLORS_THEME.black}
                  display="flex"
                  flexDirection="row"
                  gap={16}
                  paddingX={16}
                  paddingTop={24}
                >
                  <Input
                    defaultValue={"NAME"}
                    color={COLORS_THEME.primary}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                    width={"50%"}
                    height={"10%"}
                  />
                  <Input
                    defaultValue={"COMPANY"}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                    width={"50%"}
                    height={"10%"}
                  />
                </Container>
                <Container
                  width="100%"
                  backgroundColor={COLORS_THEME.black}
                  display="flex"
                  flexDirection="column"
                  paddingX={16}
                  gap={8}
                >
                  <Input
                    defaultValue={"EMAIL"}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                    width={"100%"}
                    height={"10%"}
                  />
                  <Input
                    defaultValue={"BUDGET (OPTIONAL)"}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                    width={"100%"}
                    height={"10%"}
                  />
                  <Input
                    defaultValue={"MESSAGE"}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                    width={"100%"}
                    height={80}
                  />
                </Container>
                <Container
                  display="flex"
                  flexDirection="row"
                  justifyContent="center"
                  alignItems="center"
                  paddingY={8}
                  paddingX={16}
                  width="100%"
                >
                  <Text
                    width="100%"
                    borderColor={COLORS_THEME.primary}
                    paddingY={8}
                    textAlign="center"
                    borderWidth={1}
                  >
                    SUBMIT MESSAGE -{">"}
                  </Text>
                </Container>
              </Container>
            </Container>
            <Container
              width="100%"
              height="10%"
              backgroundColor={COLORS_THEME.black}
              display="flex"
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              paddingX={16}
            >
              <Container gap={8}>
                <Text borderBottomWidth={1} borderColor={COLORS_THEME.primary}>
                  X (TWITTER),
                </Text>
                <Text borderBottomWidth={1} borderColor={COLORS_THEME.primary}>
                  INSTAGRAM,
                </Text>
                <Text borderBottomWidth={1} borderColor={COLORS_THEME.primary}>
                  GITHUB
                </Text>
              </Container>
              <Text borderBottomWidth={1} borderColor={COLORS_THEME.primary}>
                HELLO@BASEMENT.STUDIO
              </Text>
            </Container>
          </DefaultProperties>
        </FontFamilyProvider>
      </Root>
    </>
  )
}

const ContactScene = ({ modelUrl }: { modelUrl: string }) => {
  const gltf = useGLTF(modelUrl)
  const animationMixerRef = useRef<AnimationMixer | null>(null)
  const phoneGroupRef = useRef<Group>(null)

  const [screenMesh, setScreenMesh] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)

  const glass = gltf.scene.children[0].getObjectByName("GLASS") as
    | Mesh
    | undefined

  const renderTarget = useMemo(() => new WebGLRenderTarget(2024, 2024), [])
  const screenMaterial = useMemo(() => createScreenMaterial(), [])

  useEffect(() => {
    const screen = gltf.scene.children[0].getObjectByName(
      "SCREEN"
    ) as SkinnedMesh
    console.log(gltf.scene.children[0].children)
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

      <group scale={8} ref={phoneGroupRef}>
        <primitive position-y={-0.05} object={gltf.scene} />
      </group>
    </>
  )
}

export default ContactScene
