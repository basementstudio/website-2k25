import { Container, Icon, Image, Root, Text } from "@react-three/uikit"
import { Separator } from "@react-three/uikit-default"
import { useEffect, useState } from "react"

import { COLORS_THEME } from "./screen-ui"

interface Contributor {
  id: string
  url: string
  name: string
  avatarUrl: string
  email: string
  company: string
}

interface Experiment {
  filename: string
  title: string
  href: string
  tags: string[]
  og: null | string
  number: number
  contributors: Contributor[]
}

export const LabsUI = () => {
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
              >
                <List />
                <Container
                  width={"35%"}
                  height={"50%"}
                  borderWidth={4}
                  borderColor={COLORS_THEME.primary}
                  marginLeft={32}
                />
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

const TextTag = ({ text, icon }: { text: string; icon?: boolean }) => {
  return (
    <Container
      display={"flex"}
      flexDirection={"row"}
      gap={10}
      positionType={"absolute"}
      backgroundColor={COLORS_THEME.black}
      zIndexOffset={10}
      paddingX={8}
      positionTop={-3}
      positionLeft={10}
    >
      <Text
        fontSize={20}
        color={COLORS_THEME.primary}
        fontWeight={"bold"}
        backgroundColor={COLORS_THEME.black}
      >
        {text}
      </Text>
      {icon && (
        <Icon
          color={COLORS_THEME.primary}
          text={`<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 4.8L1.99835e-07 0L2.28571 1.04905e-07L2.28571 2.4L4.57143 2.4V4.8L6.85714 4.8V7.2H9.14286V4.8H11.4286V2.4H13.7143V6.29446e-07L16 7.34351e-07V4.8H13.7143V7.2H11.4286V9.6H9.14286L9.14286 12H6.85714L6.85714 9.6H4.57143L4.57143 7.2H2.28571L2.28571 4.8H0Z" fill="#F68300"/></svg>`}
          svgWidth={16}
          svgHeight={16}
          width={16}
          height={16}
          marginTop={6}
        />
      )}
    </Container>
  )
}

const List = () => {
  const [experiments, setExperiments] = useState<Experiment[] | null>(null)

  useEffect(() => {
    async function fetchExperiments() {
      const res = await fetch("https://lab.basement.studio/experiments.json")
      const data = await res.json()
      setExperiments(data)
    }
    fetchExperiments()
  }, [])

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
        experiments.map((data, idx) => (
          <ListItem
            key={idx}
            data={data}
            idx={idx}
            total={experiments.length}
          />
        ))}
    </Container>
  )
}

const ListItem = ({
  data,
  idx,
  total
}: {
  data: Experiment
  idx: number
  total: number
}) => {
  const { title, contributors } = data
  return (
    <Container
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
    >
      <Container width={"28%"}>
        <Text fontSize={20} fontWeight={"bold"} color={COLORS_THEME.primary}>
          {title}
        </Text>
      </Container>

      <Container display={"flex"} flexDirection={"row"} gap={8} width={"50%"}>
        <Text fontSize={20} fontWeight={"bold"} color={COLORS_THEME.primary}>
          B:
        </Text>
        {contributors.map((contributor, idx) => (
          <Text
            fontSize={20}
            fontWeight={"bold"}
            color={COLORS_THEME.primary}
            key={idx}
          >
            /{contributor.name}
          </Text>
        ))}
      </Container>

      <Container
        display={"flex"}
        flexDirection={"row"}
        flexGrow={0.6}
        gap={8}
        justifyContent={"flex-start"}
      >
        <Text fontSize={20} fontWeight={"bold"} color={COLORS_THEME.primary}>
          View Live
        </Text>
        <Text fontSize={20} fontWeight={"bold"} color={COLORS_THEME.primary}>
          Source
        </Text>
      </Container>
    </Container>
  )
}

const GameCovers = () => {
  return (
    <>
      <Container width={"100%"} height={"35%"} paddingTop={16}>
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
            <Container width={"65%"} height={"100%"} positionType={"relative"}>
              <TextTag text="Arcade" icon />
            </Container>
          </Container>
        </Container>
        <Container
          width={"100%"}
          height={"100%"}
          paddingTop={32}
          paddingX={14}
          paddingBottom={16}
        >
          <Container
            width={"100%"}
            height={"100%"}
            borderWidth={3}
            borderColor={COLORS_THEME.primary}
          >
            <Container
              width={"50%"}
              height={"100%"}
              positionType={"relative"}
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Image
                src={`/images/arcade-screen/chronicles.jpg`}
                width={"100%"}
                height={"100%"}
                objectFit={"cover"}
                positionType={"absolute"}
              />
              <Container
                height={30}
                width={"auto"}
                backgroundColor={COLORS_THEME.black}
                zIndexOffset={1}
              >
                <Text
                  fontSize={20}
                  fontWeight={"bold"}
                  color={COLORS_THEME.primary}
                >
                  Play Basment Chronicles
                </Text>
              </Container>
            </Container>
            <Separator
              orientation="vertical"
              backgroundColor={COLORS_THEME.primary}
              width={3}
            />
            <Container
              width={"50%"}
              height={"100%"}
              positionType={"relative"}
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Image
                src={`/images/arcade-screen/chronicles.jpg`}
                width={"100%"}
                height={"100%"}
                objectFit={"cover"}
                positionType={"absolute"}
              />
              <Container
                height={30}
                width={"auto"}
                backgroundColor={COLORS_THEME.black}
                zIndexOffset={1}
              >
                <Text
                  fontSize={20}
                  fontWeight={"bold"}
                  color={COLORS_THEME.primary}
                >
                  Looper (coming soon)
                </Text>
              </Container>
            </Container>
          </Container>
        </Container>
      </Container>
    </>
  )
}
