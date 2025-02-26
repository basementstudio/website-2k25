import { PerspectiveCamera } from "@react-three/drei"

import { useNavigationStore } from "../navigation-handler/navigation-store"

const CCTVCamera = () => {
  const cameraConfig = useNavigationStore.getState().currentScene?.cameraConfig

  return (
    <>
      <PerspectiveCamera
        fov={60}
        position={[8.4, 3.85, -6.4]}
        lookAt={[6.8, 3.2, -8.51]}
      />
    </>
  )
}

export default CCTVCamera
