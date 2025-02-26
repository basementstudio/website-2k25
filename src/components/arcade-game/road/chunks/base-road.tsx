import { CHUNK_SIZE, LINES } from "../use-road"
import { Grid } from "../../entities/grid"
import { COLORS } from "../../lib/colors"

export const BaseRoad = () => {
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
        <meshStandardMaterial color={COLORS.blue} />
      </mesh>
      <Grid
        position={[0, 0.1, 0]}
        size={CHUNK_SIZE / 2}
        divisions={[LINES, 2]}
      />
    </group>
  )
}
