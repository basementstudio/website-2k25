import { PerspectiveCamera } from "@react-three/drei"
import {
  Container,
  DefaultProperties,
  FontFamilyProvider,
  Image,
  Root,
  Text
} from "@react-three/uikit"
import { Separator } from "@react-three/uikit-default"
import { Vector3 } from "three"

import { ArcadeLabsList } from "./arcade-ui-components/arcade-labs-list"
import { ArcadePreview } from "./arcade-ui-components/arcade-preview"
import { ArcadeTitleTagsHeader } from "./arcade-ui-components/arcade-title-tags-header"
import { ArcadeWrapperTags } from "./arcade-ui-components/arcade-wrapper-tags"

interface ScreenUIProps {
  screenScale?: Vector3 | null
}

export const COLORS_THEME = {
  primary: "#FF4D00",
  black: "#0D0D0D"
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
              borderWidth={1.5}
              borderColor={COLORS_THEME.primary}
              borderRadius={10}
              paddingY={10}
              flexDirection="column"
            >
              <ArcadeWrapperTags />
              <ArcadeTitleTagsHeader />
              <Container
                width={"100%"}
                flexGrow={1}
                zIndexOffset={16}
                padding={10}
                flexDirection="row"
                gap={10}
              >
                <ArcadeLabsList />
                <ArcadePreview />
              </Container>
              <Container paddingX={10} width={"100%"} height={100}>
                <Container
                  width={"100%"}
                  height={"100%"}
                  borderWidth={1}
                  borderColor={COLORS_THEME.primary}
                  flexDirection="row"
                >
                  <Container
                    width={"50%"}
                    height={"100%"}
                    positionType="relative"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Container
                      backgroundColor={COLORS_THEME.black}
                      positionType="absolute"
                      width={"auto"}
                      zIndexOffset={10}
                      height={16}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text
                        fontSize={8}
                        paddingX={4}
                        color={COLORS_THEME.primary}
                        zIndexOffset={10}
                        positionTop={4}
                      >
                        PLAY BASEMENT CHRONICLES
                      </Text>
                    </Container>
                    <Image
                      src="/images/arcade-screen/chronicles.jpg"
                      width={"100%"}
                      height={"100%"}
                      objectFit="cover"
                      positionType="absolute"
                    />
                  </Container>
                  <Separator
                    width={1}
                    backgroundColor={COLORS_THEME.primary}
                    orientation="vertical"
                  />
                  <Container
                    width={"50%"}
                    height={"100%"}
                    positionType="relative"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Container
                      backgroundColor={COLORS_THEME.black}
                      positionType="absolute"
                      width={"auto"}
                      zIndexOffset={10}
                      height={16}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text
                        fontSize={8}
                        paddingX={4}
                        color={COLORS_THEME.primary}
                        zIndexOffset={10}
                        positionTop={4}
                      >
                        LOOPER (COOMING SOON)
                      </Text>
                    </Container>
                    <Image
                      src="/images/arcade-screen/chronicles.jpg"
                      width={"100%"}
                      height={"100%"}
                      objectFit="cover"
                      positionType="absolute"
                    />
                  </Container>
                </Container>
              </Container>
            </Container>
          </DefaultProperties>
        </FontFamilyProvider>
      </Root>
    </>
  )
}
