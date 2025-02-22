import { PerspectiveCamera } from "@react-three/drei"

export const ArcadePatas = () => {
  return (
    <>
      <color attach="background" args={["green"]} />
      {/* Top Camera */}
      <PerspectiveCamera
        makeDefault
        position={[0, 10, 10]}
        fov={15}
        ref={(camera) => {
          if (camera) {
            camera.lookAt(0, 0, 0)
          }
        }}
      />
      <ambientLight intensity={4} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      <mesh>
        <planeGeometry args={[5, 5]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </>
  )
}
