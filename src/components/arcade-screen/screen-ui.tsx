import { PerspectiveCamera } from '@react-three/drei';
import {
  Container,
  Root,
  Text,
  Image
} from '@react-three/uikit';
import { Separator } from '@react-three/uikit-default';
import { useState } from 'react';

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

export const ScreenUI = ({size}: {size: {width: number, height: number}}) => {
  const [selectedLab, setSelectedLab] = useState(0);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 7.8]} />
      <Root
        transformScaleY={-1}
        width={size.width}
        height={size.height}
      >
        <Container display={"flex"} width={"100%"} height={"100%"} backgroundColor={"blue"}>
         <Container 
          width="100%"
          height="100%"
          overflow="scroll"
          padding={10}
          backgroundColor={'#171717'}>
          <Container width={"100%"} height={"100%"} backgroundColor={"#000"} display={"flex"} flexDirection={"column"} gap={16} borderWidth={2} borderColor={"orange"} padding={16}>
            <Container display={"flex"} flexDirection={"row"} gap={16} height={"70%"}>
              <Container width={"60%"} height={"100%"} display={"flex"} flexDirection={"column"} overflow={"scroll"} borderWidth={2} borderColor={"orange"} >
                {LABS_DATA.map(({title, contributors}, idx) => (
                    <>
                      <Container
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
                              color={'#fff'}
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
                    </>
                ))}
              </Container>
              <Container width={"40%"} height={"100%"} display={"flex"} flexDirection={"column"} gap={16}>
                <Image src={LABS_DATA[selectedLab].image} objectFit={"cover"} borderWidth={2} borderColor={"orange"}/>
                <Text color={'#fff'} fontWeight={'bold'} fontSize={14}>{LABS_DATA[selectedLab].description}</Text>
              </Container>
            </Container>
              <Container
                width={'100%'}
                height={'28%'}
                backgroundColor={'#FF4D00'}
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
                  <Container backgroundColor={'#000'} zIndexOffset={1} onClick={() => {
                    window.open("https://chronicles.basement.studio/", '_blank');
                  }}>
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
