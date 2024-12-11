import {
  Container,
  Root,
  Text,
} from '@react-three/uikit';

export const ScreenUI = () => {
  
  return (
    <>
      <Root
        transformScaleY={-1}
        flexDirection="row"
      >
        <Container backgroundColor="#000" width={"100%"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
          <Text color="#fff"
            onPointerOut={() => {
              document.body.style.cursor = 'default'
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
      </Root>
    </>
  );
};