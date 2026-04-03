import { Suspense } from "react"

import { useAssets } from "@/components/assets-provider"

import { COLORS, FONT_SIZE_SMALL } from "../constants"
import { UIImage } from "../ui-image"
import { UIPanel } from "../ui-panel"
import { UIText } from "../ui-text"

interface PreviewProps {
  selectedExperiment: any
  width: number
  height: number
}

export const Preview = ({
  selectedExperiment,
  width,
  height
}: PreviewProps) => {
  const { arcade } = useAssets()

  const imageWidth = width
  const imageHeight = width * (9 / 16) // 16:9 aspect ratio
  const descY = imageHeight + 10

  const imageSrc = selectedExperiment?.cover?.url ?? arcade.placeholderLab

  const description = selectedExperiment?.description
    ? selectedExperiment.description.toUpperCase().slice(0, 100) +
      (selectedExperiment.description.length > 100 ? "..." : "")
    : ""

  return (
    <group>
      {/* Image container with border */}
      <UIPanel
        width={imageWidth}
        height={imageHeight}
        position={[imageWidth / 2, -imageHeight / 2, 0]}
        borderColor={COLORS.primary}
        borderWidth={1.5}
        bgColor={COLORS.black}
        renderOrder={2}
      />

      {/* Image */}
      <Suspense fallback={null}>
        <UIImage
          src={imageSrc}
          width={imageWidth - 3}
          height={imageHeight - 3}
          position={[1.5, -1.5, 0.01]}
          renderOrder={3}
        />
      </Suspense>

      {/* Description text */}
      {description && (
        <UIText
          text={description}
          fontSize={FONT_SIZE_SMALL}
          color={COLORS.primary}
          position={[0, -descY, 0.01]}
          renderOrder={2}
        />
      )}
    </group>
  )
}
