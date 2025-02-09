import { PerspectiveCamera } from "@react-three/drei"
import {
  Container,
  DefaultProperties,
  FontFamilyProvider,
  Root,
  Text
} from "@react-three/uikit"
import { Vector3 } from "three"

interface ScreenUIProps {
  screenScale?: Vector3 | null
}

export const COLORS_THEME = {
  primary: "#FF4D00",
  black: "#000000"
}

export const ScreenUI = ({ screenScale }: ScreenUIProps) => {
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
        height={370}
        transformScaleX={-1}
        backgroundColor={COLORS_THEME.black}
        positionType="relative"
        display="flex"
        flexDirection="column"
        padding={12}
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
            <Container
              width={"100%"}
              height={"100%"}
              borderWidth={1}
              borderColor={COLORS_THEME.primary}
              borderRadius={10}
            >
              <Text
                fontSize={12}
                color={COLORS_THEME.primary}
                fontWeight="normal"
                positionType="absolute"
                positionTop={-3}
                positionLeft={12}
                paddingX={4}
                backgroundColor={COLORS_THEME.black}
                zIndexOffset={10}
              >
                CLOSE
              </Text>
              <Text
                fontSize={10}
                color={COLORS_THEME.primary}
                fontWeight="normal"
                positionType="absolute"
                positionBottom={-10}
                positionRight={12}
                paddingX={4}
                backgroundColor={COLORS_THEME.black}
                zIndexOffset={10}
              >
                LABS V1.0
              </Text>
            </Container>
          </DefaultProperties>
        </FontFamilyProvider>
      </Root>
    </>
  )
}
