import { Grid } from "@react-three/drei"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { useControls } from "leva"
import { Vector3 } from "three"

import type { CameraName } from "@/store/app-store"
import { useCameraStore } from "@/store/app-store"

export function Debug() {
  const orbitCamera = useCameraStore((state) => state.orbitCamera)

  useControls(() => ({
    camera: {
      value: "main",
      options: ["debug-orbit", "main"] satisfies CameraName[],
      onChange: (value: CameraName) => {
        useCameraStore.setState({ activeCamera: value })
      }
    }
  }))

  return (
    <>
      <PerspectiveCamera
        ref={(camera) => useCameraStore.setState({ orbitCamera: camera })}
        position={[10, 2, -16]}
      />
      {orbitCamera && (
        <OrbitControls camera={orbitCamera} target={new Vector3(6, 1, -10)} />
      )}
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
  )
}
