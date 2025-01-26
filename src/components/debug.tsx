import { Grid } from "@react-three/drei"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { useControls } from "leva"
import { useState } from "react"

import { useNavigationStore } from "./navigation-handler/navigation-store"

export function Debug() {
  const orbitCamera = useNavigationStore((state) => state.orbitCamera)
  const [camera, setCamera] = useState("main")

  useControls(() => ({
    camera: {
      value: "main",
      options: ["debug-orbit", "main"],
      onChange: (value) => {
        useNavigationStore.setState({ activeCamera: value })
        setCamera(value)
      }
    }
  }))

  return (
    <>
      <PerspectiveCamera
        ref={(camera) => useNavigationStore.setState({ orbitCamera: camera })}
        position={[10, 2, -16]}
      />
      {orbitCamera && <OrbitControls camera={orbitCamera} />}
      {camera === "debug-orbit" && (
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
      )}
    </>
  )
}
