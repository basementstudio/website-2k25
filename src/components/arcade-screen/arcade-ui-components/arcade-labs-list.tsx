import { Container, Text } from "@react-three/uikit"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"

import { COLORS_THEME } from "../screen-ui"

interface ArcadeLabsListProps {
  experiments: any[]
  selectedExperiment: any
  setSelectedExperiment: (experiment: any) => void
}

export const ArcadeLabsList = ({
  experiments,
  selectedExperiment,
  setSelectedExperiment
}: ArcadeLabsListProps) => {
  const setCursorType = useMouseStore((state) => state.setCursorType)

  return (
    <Container
      width={"60%"}
      height={"100%"}
      borderWidth={1}
      borderColor={COLORS_THEME.primary}
      overflow="scroll"
      alignItems="flex-start"
      justifyContent="flex-start"
      flexDirection="column"
      paddingRight={10}
      scrollbarBorderColor={COLORS_THEME.black}
      scrollbarBorderWidth={2}
      scrollbarColor={COLORS_THEME.primary}
    >
      {experiments &&
        experiments.map((data, idx) => (
          <Container
            key={idx}
            flexDirection="row"
            justifyContent="space-between"
            width={"100%"}
            paddingLeft={8}
            paddingRight={8}
            height={24}
            borderBottomWidth={1}
            borderRightWidth={1}
            backgroundColor={
              selectedExperiment && selectedExperiment._title === data._title
                ? COLORS_THEME.primary
                : COLORS_THEME.black
            }
            borderColor={COLORS_THEME.primary}
            paddingTop={8}
            onHoverChange={(hover) => {
              if (hover) {
                setSelectedExperiment(data)
              }
            }}
          >
            <Text
              fontSize={10}
              color={
                selectedExperiment && selectedExperiment._title === data._title
                  ? COLORS_THEME.black
                  : COLORS_THEME.primary
              }
              fontWeight="normal"
              zIndexOffset={10}
            >
              {data._title.toUpperCase()}
            </Text>
            <Container width={"auto"} gap={8}>
              <Text
                fontSize={9}
                color={
                  selectedExperiment &&
                  selectedExperiment._title === data._title
                    ? COLORS_THEME.black
                    : COLORS_THEME.primary
                }
                fontWeight="normal"
                onClick={() => {
                  window.open(
                    `https://github.com/basementstudio/basement-laboratory/tree/main/src/experiments/${data.url}`,
                    "_blank"
                  )
                }}
                onHoverChange={(hover) => {
                  if (hover) {
                    setCursorType("click")
                  } else {
                    setCursorType("default")
                  }
                }}
              >
                CODE
              </Text>
              <Text
                fontSize={9}
                color={
                  selectedExperiment &&
                  selectedExperiment._title === data._title
                    ? COLORS_THEME.black
                    : COLORS_THEME.primary
                }
                fontWeight="normal"
                onClick={() => {
                  window.open(
                    `https://lab.basement.studio/experiments/${data.url}`,
                    "_blank"
                  )
                }}
                onHoverChange={(hover) => {
                  if (hover) {
                    setCursorType("click")
                  } else {
                    setCursorType("default")
                  }
                }}
              >
                LIVE
              </Text>
            </Container>
          </Container>
        ))}
    </Container>
  )
}
