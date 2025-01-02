import { Container, Image, Root, Text } from "@react-three/uikit"
import { Separator } from "@react-three/uikit-default"
import { useEffect, useMemo, useState } from "react"

import { fetchLaboratory } from "@/actions/laboratory-fetch"

import { GameCovers } from "./game-covers"
import { COLORS_THEME } from "./screen-ui"
import { TextTag } from "./text-tags"

interface Experiment {
  _title: string
  url: string | null
  cover: {
    url: string
    width: number
    height: number
    alt: string | null
  } | null
  description: {
    json: any
  } | null
}

interface Contributor {
  id: string
  url: string
  name: string
  avatarUrl: string
  email: string
  company: string
}

export const LabsUI = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [selectedExperiment, setSelectedExperiment] =
    useState<Experiment | null>(null)
  const [experimentsContributors, setExperimentsContributors] = useState<
    Record<string, Contributor[]>
  >({})

  useEffect(() => {
    fetch("https://lab.basement.studio/experiments.json")
      .then((res) => res.json())
      .then((data) => {
        const contributorsMap: Record<string, Contributor[]> = {}
        data.forEach(
          (exp: { filename: string; contributors: Contributor[] }) => {
            if (exp.filename) {
              contributorsMap[exp.filename] = exp.contributors || []
            }
          }
        )
        setExperimentsContributors(contributorsMap)
      })
    fetchLaboratory().then((data) => {
      setExperiments(data.projectList.items)
    })
  }, [])

  if (!experiments) return null

  return (
    <>
      <Root
        transformScaleY={-1}
        width={2000}
        height={1180}
        backgroundColor={COLORS_THEME.black}
        padding={20}
        positionType={"relative"}
        display={"flex"}
        flexDirection={"column"}
      >
        <Text
          fontSize={20}
          color={COLORS_THEME.primary}
          fontWeight={"bold"}
          positionType={"absolute"}
          positionTop={8}
          positionLeft={32}
          paddingX={8}
          backgroundColor={COLORS_THEME.black}
          zIndexOffset={10}
        >
          Close [X]
        </Text>

        <Container
          width={"100%"}
          height={"100%"}
          borderWidth={5}
          borderColor={COLORS_THEME.primary}
          paddingTop={32}
          display={"flex"}
          flexDirection={"column"}
        >
          <Container
            width={"100%"}
            height={"100%"}
            display={"flex"}
            flexDirection={"column"}
            positionType={"relative"}
          >
            <Container
              height={20}
              width={"100%"}
              paddingTop={10}
              positionType={"absolute"}
            >
              <Separator
                orientation="horizontal"
                backgroundColor={COLORS_THEME.primary}
                height={2}
              />
              <Container
                positionType={"absolute"}
                width={"100%"}
                height={16}
                positionTop={0}
                positionLeft={0}
              >
                <Container
                  width={"65%"}
                  height={"100%"}
                  positionType={"relative"}
                >
                  <TextTag text="Experiments" icon />
                </Container>
                <Container
                  width={"35%"}
                  height={"100%"}
                  positionType={"relative"}
                >
                  <TextTag text="Preview" icon />
                </Container>
              </Container>
            </Container>

            <Container
              width={"100%"}
              height={"100%"}
              paddingTop={32}
              display={"flex"}
              flexDirection={"column"}
            >
              <Container
                width={"100%"}
                height={"65%"}
                paddingX={14}
                display={"flex"}
                flexDirection={"row"}
                gap={14}
              >
                <List
                  experiments={experiments}
                  setSelectedExperiment={setSelectedExperiment}
                  selectedExperiment={selectedExperiment}
                  experimentsContributors={experimentsContributors}
                />
                <Container
                  width={"35%"}
                  display={"flex"}
                  flexDirection={"column"}
                  gap={16}
                  paddingLeft={14}
                >
                  <Container
                    width={"100%"}
                    height={"50%"}
                    borderWidth={3}
                    borderColor={"red"}
                    positionType={"relative"}
                  >
                    {selectedExperiment && (
                      <Image
                        src={`${selectedExperiment.cover?.url}`}
                        width={"100%"}
                        height={"100%"}
                        objectFit={"cover"}
                        positionType={"absolute"}
                      />
                    )}
                  </Container>
                  {selectedExperiment && (
                    <Text
                      fontSize={22}
                      color={COLORS_THEME.primary}
                      fontWeight={"bold"}
                      backgroundColor={COLORS_THEME.black}
                    >
                      {selectedExperiment._title}
                    </Text>
                  )}
                </Container>
              </Container>
              <GameCovers />
            </Container>
          </Container>
        </Container>
        <Container
          width={"auto"}
          height={"auto"}
          positionType={"absolute"}
          positionBottom={32}
          positionRight={148}
        >
          <TextTag text="Lab V1.0" />
        </Container>
      </Root>
    </>
  )
}

const List = ({
  experiments,
  setSelectedExperiment,
  selectedExperiment,
  experimentsContributors
}: {
  experiments: Experiment[]
  setSelectedExperiment: (experiment: Experiment | null) => void
  selectedExperiment: Experiment | null
  experimentsContributors: Record<string, Contributor[]>
}) => {
  return (
    <Container
      width={"65%"}
      height={"100%"}
      borderWidth={4}
      borderColor={COLORS_THEME.primary}
      display={"flex"}
      flexDirection={"column"}
      overflow={"scroll"}
      paddingRight={12}
      scrollbarColor={COLORS_THEME.primary}
    >
      {experiments &&
        experiments
          .slice(0, 40)
          .map(({ _title, url }, idx) => (
            <ListItem
              title={_title}
              url={url}
              idx={idx}
              total={experiments.length}
              key={idx}
              setSelectedExperiment={() =>
                setSelectedExperiment(experiments[idx])
              }
              selectedExperiment={selectedExperiment}
              experiments={experiments}
              experimentsContributors={experimentsContributors}
            />
          ))}
    </Container>
  )
}

const ListItem = ({
  title,
  url,
  idx,
  total,
  setSelectedExperiment,
  selectedExperiment,
  experiments,
  experimentsContributors
}: {
  title: string
  url: string | null
  idx: number
  total: number
  setSelectedExperiment: (experiment: Experiment | null) => void
  selectedExperiment: Experiment | null
  experiments: Experiment[]
  experimentsContributors: Record<string, Contributor[]>
}) => {
  const textColor = useMemo(() => {
    return selectedExperiment?._title === title
      ? COLORS_THEME.black
      : COLORS_THEME.primary
  }, [selectedExperiment, title])

  const [selectedContributor, setSelectedContributor] = useState<string | null>(
    null
  )
  const [hoveredLink, setHoveredLink] = useState<"source" | "live" | null>(null)

  return (
    <Container
      key={idx}
      width={"100%"}
      height={50}
      borderBottomWidth={idx === total - 1 ? 0 : 3}
      borderRightWidth={4}
      borderColor={COLORS_THEME.primary}
      paddingX={16}
      display={"flex"}
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      onPointerOver={() => setSelectedExperiment(experiments[idx])}
      onPointerOut={() => setSelectedExperiment(null)}
      backgroundColor={
        selectedExperiment?._title === title ? COLORS_THEME.primary : undefined
      }
      onClick={() =>
        window.open(`https://lab.basement.studio/experiments/${url}`, "_blank")
      }
    >
      <Container width={"30%"}>
        <Text fontSize={22} fontWeight={"bold"} color={textColor}>
          {title}
        </Text>
      </Container>

      <Container display={"flex"} flexDirection={"row"} gap={8} width={"50%"}>
        <Text fontSize={20} fontWeight={"bold"} color={textColor}>
          B:
        </Text>
        {experimentsContributors[url || ""]?.map((contributor, idx) => (
          <Container
            key={contributor.id}
            positionType={"relative"}
            onPointerOver={() => setSelectedContributor(contributor.id)}
            onPointerOut={() => setSelectedContributor(null)}
            onClick={() => window.open(contributor.url, "_blank")}
          >
            <Text fontSize={22} fontWeight={"bold"} color={textColor}>
              /{contributor.name}
            </Text>
            {selectedContributor === contributor.id && (
              <Container
                positionType={"absolute"}
                width={"100%"}
                height={4}
                positionBottom={-3}
                backgroundColor={"#171717"}
              />
            )}
          </Container>
        ))}
      </Container>

      <Container
        display={"flex"}
        flexDirection={"row"}
        flexGrow={0.6}
        gap={8}
        justifyContent={"flex-start"}
      >
        <Container positionType={"relative"}>
          <Text
            fontSize={22}
            fontWeight={"bold"}
            color={textColor}
            onPointerOver={() => setHoveredLink("live")}
            onPointerOut={() => setHoveredLink(null)}
          >
            View Live
          </Text>
          {hoveredLink === "live" && (
            <Container
              positionType={"absolute"}
              width={"100%"}
              height={4}
              positionBottom={-3}
              backgroundColor={"#171717"}
            />
          )}
        </Container>
        <Container positionType={"relative"}>
          <Text
            fontSize={22}
            fontWeight={"bold"}
            color={textColor}
            onPointerOver={() => setHoveredLink("source")}
            onPointerOut={() => setHoveredLink(null)}
            onClick={() =>
              window.open(
                `https://github.com/basementstudio/basement-laboratory/tree/main/src/experiments/${url}`,
                "_blank"
              )
            }
          >
            Source
          </Text>
          {hoveredLink === "source" && (
            <Container
              positionType={"absolute"}
              width={"100%"}
              height={4}
              positionBottom={-3}
              backgroundColor={"#171717"}
            />
          )}
        </Container>
      </Container>
    </Container>
  )
}
