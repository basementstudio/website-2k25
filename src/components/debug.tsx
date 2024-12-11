import { Grid } from "@react-three/drei";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Vector3 } from "three";

export function Debug() {
  return (
    <>
      <mesh position={[6, 1, -10]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <PerspectiveCamera makeDefault position={[10, 2, -16]} />
      <OrbitControls target={new Vector3(6, 1, -10)} />
      <Grid
        opacity={0.5}
        position={[0, -0.01, 0]}
        infiniteGrid
        sectionSize={1}
        cellSize={0.1}
        cellThickness={0.8}
        sectionColor="#757575"
        cellColor="#656565"
      />
    </>
  );
}
