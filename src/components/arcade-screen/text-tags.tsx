import { Container, Icon, Text } from "@react-three/uikit"

import { COLORS_THEME } from "./screen-ui"

export const TextTag = ({ text, icon }: { text: string; icon?: boolean }) => {
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
