
import { PerspectiveCamera, useCursor } from '@react-three/drei';
import {
  Container,
  Root,
  Text,
} from '@react-three/uikit';
import { useState } from 'react';

export const ScreenUI = () => {
  const [hover, setHover] = useState(false);
  useCursor(hover);

  return (
    <>
    <PerspectiveCamera makeDefault position={[0, 0, 1]} />
      <Root
        transformScaleY={-1}
        flexDirection="row"
      >
        <Container width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
          <Text color="#fff"
            onPointerEnter={() => setHover(true)}  
            onPointerLeave={() => setHover(false)}
            onClick={() => {
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