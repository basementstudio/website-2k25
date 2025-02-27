import { PerspectiveCamera } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Mesh, WebGLRenderTarget } from "three"

import { useMesh } from "@/hooks/use-mesh"
import { createScreenMaterial } from "@/shaders/material-screen"

import { RenderTexture } from "../arcade-screen/render-texture"

const CCTVCamera = () => {
  const renderTarget = useMemo(() => new WebGLRenderTarget(1024, 768), [])
  const screenMaterial = useMemo(() => createScreenMaterial(), [])
  const cctvScreen = useMesh((state) => state.cctv.screen)
  const boxRef = useRef<Mesh>(null)

  useEffect(() => {
    if (cctvScreen) {
      screenMaterial.uniforms.map.value = renderTarget.texture
      screenMaterial.uniforms.uRevealProgress = { value: 1.0 }
      screenMaterial.needsUpdate = true
      cctvScreen.material = screenMaterial
    }
  }, [cctvScreen, renderTarget.texture, screenMaterial])

  useFrame((_, delta) => {
    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }

    if (boxRef.current) {
      boxRef.current.rotation.y += delta
      boxRef.current.rotation.x += delta
    }
  })

  return (
    <>
      {/* <PerspectiveCamera
        fov={60}
        position={[8.4, 3.85, -6.4]}
        lookAt={[6.8, 3.2, -8.51]}
      /> */}

      <RenderTexture
        fbo={renderTarget}
        raycasterMesh={cctvScreen || undefined}
        isPlaying={true}
      >
        <color attach="background" args={["#000000"]} />
        <PerspectiveCamera
          manual
          makeDefault
          position={[0, 0, 4]}
          rotation={[0, 0, Math.PI]}
          fov={60}
        />
        <mesh ref={boxRef} scale={2}>
          <boxGeometry />
          <meshBasicMaterial color="orange" />
        </mesh>
      </RenderTexture>
    </>
  )
}

export default CCTVCamera
