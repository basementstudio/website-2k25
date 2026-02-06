import { COLORS, FONT_SIZE_HEADER } from "../constants"
import { UIPanel } from "../ui-panel"
import { UIText } from "../ui-text"

interface TitleHeaderProps {
  y: number
  contentWidth: number
  leftWidth: number
  paddingX: number
}

export const TitleHeader = ({
  y,
  contentWidth,
  leftWidth,
  paddingX
}: TitleHeaderProps) => {
  return (
    <group position={[0, -y, 0.01]}>
      {/* Horizontal separator line */}
      <UIPanel
        width={contentWidth + paddingX * 2}
        height={1.5}
        position={[
          (contentWidth + paddingX * 2) / 2,
          -8,
          0
        ]}
        bgColor={COLORS.primary}
        renderOrder={2}
      />

      {/* "EXPERIMENTS" label */}
      <group position={[paddingX + 12, -2, 0.02]}>
        <UIPanel
          width={90}
          height={16}
          bgColor={COLORS.black}
          renderOrder={3}
        >
          <UIText
            text="EXPERIMENTS"
            fontSize={FONT_SIZE_HEADER}
            color={COLORS.primary}
            position={[4, -4, 0.01]}
            renderOrder={4}
          />
        </UIPanel>
      </group>

      {/* "PREVIEW" label — at 60% of content width */}
      <group position={[paddingX + contentWidth * 0.6, -2, 0.02]}>
        <UIPanel
          width={60}
          height={16}
          bgColor={COLORS.black}
          renderOrder={3}
        >
          <UIText
            text="PREVIEW"
            fontSize={FONT_SIZE_HEADER}
            color={COLORS.primary}
            position={[4, -4, 0.01]}
            renderOrder={4}
          />
        </UIPanel>
      </group>
    </group>
  )
}
