// @ts-nocheck
import {
  Container,
  Root,
  Text,
} from '@react-three/uikit';
import { Vector2 } from 'three';

interface ScreenUIProps {
  dimensions?: Vector2;
}

export const ScreenUI = ({ dimensions = new Vector2(512, 512) }: ScreenUIProps) => {
  const aspect = dimensions.x / dimensions.y;
  
  return (
    <>
      <Root
        transformScaleY={-1}
        flexDirection="row"
      >
        <Container backgroundColor="#000" width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
          <Text color="#fff"
            onPointerOver={() => {
              console.log( "over" )
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default'
            }}
            onClick={() => {
              console.log("click")
              window.open(
                `https://basement.studio/lab`,
                '_blank'
              );  
            }}
          >
            BASEMENT LAB
          </Text>
        </Container>
      </Root>
    </>
  );
};