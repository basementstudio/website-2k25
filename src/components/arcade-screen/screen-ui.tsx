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
        backgroundColor={"orange"}
        height={1024}
        width={1024}
      >
        <Container display={"flex"} width={"100%"} height={"100%"} justifyContent={"center"} alignItems={"center"} backgroundColor={"orange"}>
          <Container backgroundColor={"#000"}>
            <Text color="#fff"
              onPointerEnter={() => {
                setHover(true)
                console.log("over")
              }}  
              onPointerLeave={() => {
                setHover(false)
                console.log("leave")
              }}
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
        </Container>
      </Root>
    </>
  );
};