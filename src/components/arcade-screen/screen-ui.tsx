
import { PerspectiveCamera } from '@react-three/drei';
import {
  Container,
  Text,
  Root,
  Icon,
  Image,
} from '@react-three/uikit';
import { useState } from 'react';
import { useRenderTexture } from './render-texture';
import { Separator } from '@react-three/uikit-default';
import { LabList } from './custom-components/lab-list';
import useNavigation from '@/hooks/use-navigation';

export interface LabData {
  title: string;
  description: string;
  image: string;
  contributors: string[];
  link: string;
}

const LABS_DATA: LabData[] = [
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
  const { aspect } = useRenderTexture();
  const [selectedLab, setSelectedLab] = useState(0);
  const handleNavigation = useNavigation();

  return (
    <>
      <color attach="background" args={['#000']} />
      <PerspectiveCamera
        manual
        aspect={aspect}
        makeDefault
        position={[0, .6, 10]}
      />
      <Root transformScaleY={-1} width={920} height={800}>
        <Container
          width="100%"
          height="100%"
          padding={16}
        >
          <Container
            width="100%"
            height="100%"
            borderColor={"orange"}
            backgroundColor={"#000"}
            borderWidth={2}
            positionType={"relative"}
          >
            <Text color={"orange"} fontWeight={"bold"} positionType={"absolute"} positionTop={-10} positionLeft={10} paddingX={8} backgroundColor={"#000"} onClick={() => {
              handleNavigation('/', "home");
            }}>Close [X]</Text>
            <Container width={"100%"} height={"auto"} marginTop={10} paddingY={16} display={"flex"} flexDirection={"column"} justifyContent={"space-between"}>
              <Container width={"100%"} height={16} positionType={"relative"} display={"flex"} alignItems={"center"} justifyContent={"center"}>
                <Separator orientation="horizontal" backgroundColor={"orange"} />
                <Container positionType={"absolute"} paddingX={8} height={16} width={"100%"} display={"flex"} flexDirection={"row"} alignItems={"center"} gap={8}>
                  <Container width={"60%"} height={16}>
                    <Container backgroundColor={"#000"} zIndexOffset={1} paddingX={8}>
                      <Text color={"orange"} fontWeight={"bold"}>Experiments</Text>
                      <Icon paddingTop={5} text={`<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 4.8L1.99835e-07 0L2.28571 1.04905e-07L2.28571 2.4L4.57143 2.4V4.8L6.85714 4.8V7.2H9.14286V4.8H11.4286V2.4H13.7143V6.29446e-07L16 7.34351e-07V4.8H13.7143V7.2H11.4286V9.6H9.14286L9.14286 12H6.85714L6.85714 9.6H4.57143L4.57143 7.2H2.28571L2.28571 4.8H0Z" fill="#F68300"/></svg>`} svgWidth={16} svgHeight={16} width={16} height={16} />
                    </Container>
                  </Container>
                  <Container width={"40%"} height={16}>
                    <Container backgroundColor={"#000"} zIndexOffset={1} paddingX={8}>
                      <Text color={"orange"} fontWeight={"bold"}>Preview</Text>
                      <Icon paddingTop={5} text={`<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 4.8L1.99835e-07 0L2.28571 1.04905e-07L2.28571 2.4L4.57143 2.4V4.8L6.85714 4.8V7.2H9.14286V4.8H11.4286V2.4H13.7143V6.29446e-07L16 7.34351e-07V4.8H13.7143V7.2H11.4286V9.6H9.14286L9.14286 12H6.85714L6.85714 9.6H4.57143L4.57143 7.2H2.28571L2.28571 4.8H0Z" fill="#F68300"/></svg>`} svgWidth={16} svgHeight={16} width={16} height={16} />
                    </Container>
                  </Container>
                </Container>
              </Container>

              <Container height={"66%"} width={"100%"} paddingTop={16} paddingX={16} display={"flex"} flexDirection={"row"} gap={16}>
                <Container width={"60%"} height={"100%"} borderColor={"orange"} borderWidth={2}>
                  <LabList selectedLab={selectedLab} setSelectedLab={setSelectedLab} data={LABS_DATA} />
                </Container>
                <Container width={"40%"} height={"100%"} display={"flex"} flexDirection={"column"} gap={8}>
                  <Container width={"100%"} height={"40%"} borderColor={"orange"} borderWidth={2} padding={8}>
                    <Container width={"100%"} height={"100%"}>
                      <Image src={LABS_DATA[selectedLab].image} width={"100%"} height={"100%"} objectFit={"cover"} positionType={"absolute"} />
                    </Container>
                  </Container>
                  <Text fontSize={14} fontWeight={"bold"} color={"orange"}>
                    {LABS_DATA[selectedLab].description}
                  </Text>
                </Container>
              </Container>

              <Container height={"100%"} width={"100%"} display={"flex"} flexDirection={"column"} paddingTop={16}>
                <Container width={"100%"} height={16} positionType={"relative"} display={"flex"} alignItems={"center"} justifyContent={"center"}>
                  <Separator orientation="horizontal" backgroundColor={"orange"} />

                  <Container positionType={"absolute"} paddingX={8} height={16} width={"100%"} display={"flex"} flexDirection={"row"} alignItems={"center"} gap={8}>
                    <Container width={"60%"} height={16}>
                      <Container backgroundColor={"#000"} paddingX={8}>
                        <Text color={"orange"} fontWeight={"bold"}>Arcade</Text>
                        <Icon paddingTop={5} text={`<svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 4.8L1.99835e-07 0L2.28571 1.04905e-07L2.28571 2.4L4.57143 2.4V4.8L6.85714 4.8V7.2H9.14286V4.8H11.4286V2.4H13.7143V6.29446e-07L16 7.34351e-07V4.8H13.7143V7.2H11.4286V9.6H9.14286L9.14286 12H6.85714L6.85714 9.6H4.57143L4.57143 7.2H2.28571L2.28571 4.8H0Z" fill="#F68300"/></svg>`} svgWidth={16} svgHeight={16} width={16} height={16} />
                      </Container>
                    </Container>
                  </Container>
                </Container>

                <Container backgroundColor={"#000"} height={"30%"} width={"100%"} display={"flex"} flexDirection={"row"} padding={16}>
                  <Container borderColor={"orange"} borderWidth={2}>
                    <Container width={"50%"} height={"100%"} positionType={"relative"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                      <Container backgroundColor={"#000"} paddingX={8} zIndexOffset={1}>
                        <Text color={"orange"} fontWeight={"bold"} fontSize={14}>Play Basment Chronicles</Text>
                      </Container>
                      <Image src={`/images/chronicles.png`} width={"100%"} height={"100%"} objectFit={"cover"} positionType={"absolute"} />
                    </Container>
                    <Separator orientation="vertical" backgroundColor={"orange"} />
                    <Container width={"50%"} height={"100%"} positionType={"relative"} display={"flex"} justifyContent={"center"} alignItems={"center"}>
                      <Container backgroundColor={"#000"} paddingX={8} zIndexOffset={1}>
                        <Text color={"orange"} fontWeight={"bold"} fontSize={14}>Looper (coming soon)</Text>
                      </Container>
                      <Image src={`/images/looper.png`} width={"100%"} height={"100%"} objectFit={"cover"} positionType={"absolute"} />
                    </Container>
                  </Container>
                </Container>
              </Container>
            </Container>
            <Text color={"orange"} zIndexOffset={1} fontWeight={"bold"} positionType={"absolute"} positionBottom={-10} positionRight={16} paddingX={8} backgroundColor={"#000"} onClick={() => {
              handleNavigation('/', "home");
            }}>Lab V1.0</Text>
          </Container>
        </Container>
      </Root >

    </>
  );
};
