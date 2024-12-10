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
        backgroundColor="red" 
        transformScaleY={-1}
        flexDirection="row"
      >
        <Container backgroundColor="orange" width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
          <Text>BASEMENT LAB</Text>
        </Container>
      </Root>
    </>
  );
};