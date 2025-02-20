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

import { ffflauta } from "../../../../public/fonts/ffflauta"
import Cursor from "./cursor"

interface WorkerState {
  formData: {
    name: string
    company: string
    email: string
    budget: string
    message: string
  }
  focusedElement: string | null
  cursorPosition: number
}

const PhoneScreenUI = ({ screenScale }: { screenScale: Vector3 }) => {
  const formData = useWorkerStore((state: WorkerState) => state.formData)
  const focusedElement = useWorkerStore(
    (state: WorkerState) => state.focusedElement
  )
  const cursorPosition = useWorkerStore(
    (state: WorkerState) => state.cursorPosition
  )

  const aspect = screenScale ? screenScale.x / screenScale.y : 1

  const COLORS_THEME = {
    primary: "#FF4D00",
    black: "#0D0D0D",
    focus: "#1E1E1E"
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
                    backgroundColor={
                      focusedElement === "name"
                        ? COLORS_THEME.focus
                        : COLORS_THEME.black
                    }
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.name || "NAME"}
                    </Text>
                    <Cursor
                      visible={focusedElement === "name"}
                      chars={cursorPosition}
                    />
                  </Container>
                  <Container
                    width={"50%"}
                    height={"10%"}
                    backgroundColor={
                      focusedElement === "company"
                        ? COLORS_THEME.focus
                        : COLORS_THEME.black
                    }
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.company || "COMPANY"}
                    </Text>
                    <Cursor
                      visible={focusedElement === "company"}
                      chars={cursorPosition}
                    />
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
                    backgroundColor={
                      focusedElement === "email"
                        ? COLORS_THEME.focus
                        : COLORS_THEME.black
                    }
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.email || "EMAIL"}
                    </Text>
                    <Cursor
                      visible={focusedElement === "email"}
                      chars={cursorPosition}
                    />
                  </Container>
                  <Container
                    width={"100%"}
                    height={"10%"}
                    backgroundColor={
                      focusedElement === "budget"
                        ? COLORS_THEME.focus
                        : COLORS_THEME.black
                    }
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text color={COLORS_THEME.primary}>
                      {formData.budget || "BUDGET (OPTIONAL)"}
                    </Text>
                    <Cursor
                      visible={focusedElement === "budget"}
                      chars={cursorPosition}
                    />
                  </Container>
                  <Container
                    width={"100%"}
                    height={80}
                    backgroundColor={
                      focusedElement === "message"
                        ? COLORS_THEME.focus
                        : COLORS_THEME.black
                    }
                    borderColor={COLORS_THEME.primary}
                    borderWidth={0}
                    borderBottomWidth={1}
                    paddingX={8}
                    paddingY={16}
                  >
                    <Text positionType="absolute" color={COLORS_THEME.primary}>
                      {formData.message || "MESSAGE"}
                    </Text>
                    <Cursor
                      visible={focusedElement === "message"}
                      chars={cursorPosition}
                      marginTop={8}
                    />
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
                    backgroundColor={
                      focusedElement === "submit"
                        ? COLORS_THEME.focus
                        : COLORS_THEME.black
                    }
                    borderColor={COLORS_THEME.primary}
                    borderWidth={1}
                    paddingY={8}
                    color={COLORS_THEME.primary}
                    textAlign="center"
                  >
                    SUBMIT MESSAGE &gt;
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
