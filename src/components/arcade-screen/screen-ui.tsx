import { PerspectiveCamera } from "@react-three/drei"
import {
  Container,
  DefaultProperties,
  FontFamilyProvider,
  Root
} from "@react-three/uikit"
import { useEffect, useRef, useState } from "react"
import { Vector3 } from "three"

import { fetchLaboratory } from "@/actions/laboratory-fetch"

import { ffflauta } from "../../../public/fonts/ffflauta"
import { ArcadeFeatured } from "./arcade-ui-components/arcade-featured"
import { ArcadeLabsList } from "./arcade-ui-components/arcade-labs-list"
import { ArcadePreview } from "./arcade-ui-components/arcade-preview"
import { ArcadeTitleTagsHeader } from "./arcade-ui-components/arcade-title-tags-header"
import { ArcadeWrapperTags } from "./arcade-ui-components/arcade-wrapper-tags"

interface ScreenUIProps {
  screenScale?: Vector3 | null
  onLoad?: () => void
}

export const COLORS_THEME = {
  primary: "#FF4D00",
  black: "#070707"
}

export const ScreenUI = ({ screenScale, onLoad }: ScreenUIProps) => {
  const aspect = screenScale ? screenScale.x / screenScale.y : 1
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad

  const [experiments, setExperiments] = useState<any[]>([])
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null)

  useEffect(() => {
    fetchLaboratory().then((data) => {
      setExperiments(
        data.projectList.items.map((item: any) => ({
          _title: item._title,
          url: item.url,
          cover: item.cover,
          description: item.description as string | null
        }))
      )
      onLoadRef.current?.()
    })
  }, [])

  return (
    <>
      <color attach="background" args={["#000000"]} />
      <PerspectiveCamera
        manual
        makeDefault
        position={[0, 0, 4.01]}
        rotation={[0, 0, Math.PI]}
        aspect={aspect}
      />
      <Root
        width={590}
        height={390}
        transformScaleX={-1}
        backgroundColor={COLORS_THEME.black}
        positionType="relative"
        display="flex"
        flexDirection="column"
        paddingY={24}
        paddingX={18}
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
                <ArcadeLabsList
                  experiments={experiments}
                  selectedExperiment={selectedExperiment}
                  setSelectedExperiment={setSelectedExperiment}
                />
                <ArcadePreview selectedExperiment={selectedExperiment} />
              </Container>
              <ArcadeFeatured />
            </Container>
          </DefaultProperties>
        </FontFamilyProvider>
      </Root>
    </>
  )
}
