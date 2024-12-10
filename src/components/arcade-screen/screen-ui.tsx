import {
  Container,
  Root,
  Text,
} from '@react-three/uikit';
import basement from './basement.png';
import { Vector2 } from 'three';



const LABS_DATA = [
  {
    title: 'Instanced grass',
    description: 'Instanced grass',
    image:  "",
    contributors: ['/git-chad'],
    link: 'https://lab.basement.studio/experiments/77.instanced-grass',
  },
  {
    title: 'Shader matcap transition',
    description:
      'Animate transition between matcap texture and shader based on scroll.',
    image:  "",
    contributors: ['/tomasferrerasdev', '/matiasngf'],
    link: 'https://lab.basement.studio/experiments/75.shader-matcap-transition.tsx',
  },
  {
    title: 'Butterfly Particle Sphere',
    description: `This example is based on this other example to show how splines can be used to create a camera rail. The camera will follow the curve and rotate to face the tangent's direction of the current point in the curve. It also modifies the target view in certain points of the curve to face other desired targets.`,
    image:  "",
    contributors: ['/ignmandagaran'],
    link: 'https://lab.basement.studio/experiments/76.butterfly-particle-sphere',
  },
];

interface ScreenUIProps {
  dimensions?: Vector2;
}

export const ScreenUI = ({ dimensions = new Vector2(512, 512) }: ScreenUIProps) => {
  const aspect = dimensions.x / dimensions.y;
  
  return (
    <>
      <Root 
        backgroundColor="red" 
        sizeX={2} 
        sizeY={2 / aspect}
        transformScaleY={-1}
        flexDirection="row"
        
      >
        <Container backgroundColor="blue">
          <Text>Basement Lab</Text>
        </Container>
      </Root>
    </>
  );
};