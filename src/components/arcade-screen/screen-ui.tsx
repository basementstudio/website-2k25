
import { PerspectiveCamera } from '@react-three/drei';
import {
  Container,
  Text,
  Image,
  Root
} from '@react-three/uikit';
import { Separator } from '@react-three/uikit-default';
import { Fragment, useState } from 'react';

const LABS_DATA = [
  {
    title: 'Instanced grass',
    description: 'Instanced grass',
    image: "/images/instanced-grass.png",
    contributors: ['/git-chad'],
    link: 'https://lab.basement.studio/experiments/77.instanced-grass',
  },
  {
    title: 'Shader matcap transition',
    description:
      'Animate transition between matcap texture and shader based on scroll.',
    image: "/images/butterflies.png",
    contributors: ['/tomasferrerasdev', '/matiasngf'],
    link: 'https://lab.basement.studio/experiments/75.shader-matcap-transition.tsx',
  },
  {
    title: 'Butterfly Particle Sphere',
    description: `This example is based on this other example to show how splines can be used to create a camera rail. The camera will follow the curve and rotate to face the tangent's direction of the current point in the curve. It also modifies the target view in certain points of the curve to face other desired targets.`,
    image: "/images/butterflies.png",
    contributors: ['/ignmandagaran'],
    link: 'https://lab.basement.studio/experiments/76.butterfly-particle-sphere',
  },
    {
    title: 'Instanced grass',
    description: 'Instanced grass',
    image: "/images/instanced-grass.png",
    contributors: ['/git-chad'],
    link: 'https://lab.basement.studio/experiments/77.instanced-grass',
  },
  {
    title: 'Shader matcap transition',
    description:
      'Animate transition between matcap texture and shader based on scroll.',
    image: "/images/instanced-grass.png",
    contributors: ['/tomasferrerasdev', '/matiasngf'],
    link: 'https://lab.basement.studio/experiments/75.shader-matcap-transition.tsx',
  },
  {
    title: 'Butterfly Particle Sphere',
    description: `This example is based on this other example to show how splines can be used to create a camera rail. The camera will follow the curve and rotate to face the tangent's direction of the current point in the curve. It also modifies the target view in certain points of the curve to face other desired targets.`,
    image: "/images/butterflies.png",
    contributors: ['/ignmandagaran'],
    link: 'https://lab.basement.studio/experiments/76.butterfly-particle-sphere',
  },
];
export const ScreenUI = () => {
  const [selectedLab, setSelectedLab] = useState(0);
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 13.5]} />
      <Root transformScaleY={-1} width={1580} height={800}>
        <Container
          flexDirection="column"
          width="100%"
          height="100%"
          overflow="scroll"
          backgroundColor={'#000'}
        >
          <Container
            height={'100%'}
            width={'100%'}
            borderColor={'orange'}
            borderWidth={2}
            display={'flex'}
            flexDirection={'column'}
            paddingY={20}
            gap={16}
          >
            <Separator backgroundColor={'orange'} width={2} />
            <Container
              flexGrow={1}
              width={'100%'}
              paddingX={20}
              display={'flex'}
              flexDirection={'row'}
              gap={16}
            >
              <Container
                height={'100%'}
                width={'100%'}
                borderColor={'orange'}
                borderWidth={2}
                display={'flex'}
                flexDirection={'column'}
                overflow={'scroll'}
              >
                {LABS_DATA.map(({ title, contributors }, idx) => (
                  <Fragment key={idx}>
                    <Container
                      width={'100%'}
                      height={'10%'}
                      paddingX={16}
                      display={'flex'}
                      flexDirection={'row'}
                      backgroundColor={selectedLab === idx ? 'orange' : '#000'}
                      cursor={'pointer'}
                      onPointerOver={() => {
                        setSelectedLab(idx);
                      }}
                      onClick={() => {
                        window.open(LABS_DATA[idx].link, '_blank');
                      }}
                    >
                      <Text
                        color={selectedLab === idx ? '#000' : 'orange'}
                        fontWeight={'bold'}
                        width={'50%'}
                      >
                        {title}
                      </Text>
                      <Container
                        display={'flex'}
                        flexDirection={'row'}
                        width={'50%'}
                        gap={8}
                      >
                        <Text
                          color={selectedLab === idx ? '#000' : 'orange'}
                          fontWeight={'bold'}
                          opacity={0.5}
                        >
                          C:
                        </Text>
                        {contributors.map((contributor) => (
                          <Text
                            key={contributor}
                            color={selectedLab === idx ? '#000' : 'orange'}
                            fontWeight={'bold'}
                            onClick={() => {
                              window.open(
                                `https://github.com${contributor}`,
                                '_blank'
                              );
                            }}
                          >
                            {contributor}
                          </Text>
                        ))}
                      </Container>
                    </Container>
                    <Separator backgroundColor={'orange'} />
                  </Fragment>
                ))}
              </Container>
              <Container
                width={'40%'}
                height={'100%'}
                display={'flex'}
                flexDirection={'column'}
                gap={16}
              >
                <Container
                  height={'67%'}
                  width={'100%'}
                  borderColor={'orange'}
                  borderWidth={2}
                  paddingY={16}
                  paddingX={16}
                  positionType={'relative'}
                >
                  <Image
                    src={LABS_DATA[selectedLab ?? 0].image ?? ''}
                    objectFit={'cover'}
                    width={'100%'}
                    aspectRatio={16 / 9}
                  />
                </Container>
                <Text color={'orange'} fontWeight={'bold'}>
                  {LABS_DATA[selectedLab ?? 0].description}
                </Text>
              </Container>
            </Container>
            <Separator backgroundColor={'orange'} />
            <Container width={'100%'} height={'30%'} paddingX={20}>
              <Container
                width={'100%'}
                height={'100%'}
                backgroundColor={'orange'}
                display={'flex'}
                flexDirection={'row'}
                borderColor={'orange'}
                borderWidth={2}
              >
                <Container
                  width={'50%'}
                  height={'100%'}
                  positionType={'relative'}
                  display={'flex'}
                  justifyContent={'center'}
                  alignItems={'center'}
                >
                  <Container backgroundColor={'#000'} zIndexOffset={1}>
                    <Text color={'orange'} fontWeight={'bold'} padding={8}>
                      Play Basment Chronicles
                    </Text>
                  </Container>
                  <Image
                    src={"/images/chronicles.png"}
                    objectFit={'cover'}
                    positionType={'absolute'}
                    width={'100%'}
                    height={'100%'}
                  />
                </Container>
                <Separator
                  backgroundColor={'orange'}
                  orientation="vertical"
                  width={2}
                />
                <Container
                  width={'50%'}
                  height={'100%'}
                  positionType={'relative'}
                  display={'flex'}
                  justifyContent={'center'}
                  alignItems={'center'}
                >
                  <Container backgroundColor={'#000'} zIndexOffset={1}>
                    <Text color={'orange'} fontWeight={'bold'} padding={8}>
                      Looper (coming soon)
                    </Text>
                  </Container>
                  <Image
                    src={"/images/looper.png"}
                    objectFit={'cover'}
                    positionType={'absolute'}
                    width={'100%'}
                    height={'100%'}
                  />
                </Container>
              </Container>
            </Container>
          </Container>
        </Container>
      </Root>
    </>
  );
};