import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useKeyControls } from "../../../../lib/use-controls";
import { useControls } from "leva";
import { CAMERA_NAMES, CameraName, useGame } from "../../../../lib/use-game";
import { useState } from "react";
import { Camera } from "three";

export const Debug = () => {
  useControls(() => ({
    Camera: {
      value: CAMERA_NAMES.PLAYER_CAMERA,
      options: CAMERA_NAMES,
      onChange: (value: CameraName) => {
        useGame.setState({ activeCamera: value });
      },
    },
  }));

  useKeyControls();

  const [camera, setCamera] = useState<Camera | undefined>(undefined);

  const activeCamera = useGame((s) => s.activeCamera);

  return (
    <>
      <PerspectiveCamera
        attach={"camera"}
        makeDefault={activeCamera === "orbit"}
        position={[0, 5, 10]}
        ref={(r) => {
          if (r) {
            setCamera(r);
          }
        }}
      />
      <OrbitControls camera={camera} />
    </>
  );
};
