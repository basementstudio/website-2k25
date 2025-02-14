import { PerspectiveCamera } from "@react-three/drei"
import {
  Container,
  DefaultProperties,
  FontFamilyProvider,
  Root,
  Text
} from "@react-three/uikit"
import { Vector3 } from "three"

import { useWorkerStore } from "@/workers/contact-worker"

import { ffflauta } from "./ffflauta"

interface WorkerState {
  formData: {
    name: string
    company: string
    email: string
    budget: string
    message: string
  }
}

const PhoneScreenUI = ({ screenScale }: { screenScale: Vector3 }) => {
  const formData = useWorkerStore((state: WorkerState) => {
    console.log("[PhoneScreenUI] Worker store state:", state.formData)
    return state.formData
  })
  const scale = screenScale.x * 0.0015

  const aspect = screenScale ? screenScale.x / screenScale.y : 1

  const COLORS_THEME = {
    primary: "#FF4D00",
    black: "#0D0D0D"
  }

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
            normal: ffflauta
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
                  <Container
                    width={"50%"}
                    height={"10%"}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.name || "NAME"}
                    </Text>
                  </Container>
                  <Container
                    width={"50%"}
                    height={"10%"}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.company || "COMPANY"}
                    </Text>
                  </Container>
                </Container>
                <Container
                  width="100%"
                  backgroundColor={COLORS_THEME.black}
                  display="flex"
                  flexDirection="column"
                  paddingX={16}
                  gap={8}
                >
                  <Container
                    width={"100%"}
                    height={"10%"}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.email || "EMAIL"}
                    </Text>
                  </Container>
                  <Container
                    width={"100%"}
                    height={"10%"}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.budget || "BUDGET (OPTIONAL)"}
                    </Text>
                  </Container>
                  <Container
                    width={"100%"}
                    height={80}
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.message || "MESSAGE"}
                    </Text>
                  </Container>
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

export default PhoneScreenUI
