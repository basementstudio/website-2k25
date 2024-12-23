import { PerspectiveCamera } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect } from "react"
import { ShaderMaterial, Texture, Vector2 } from "three"

import { useCameraStore } from "@/store/app-store"

import cctvFrag from "./cctv.frag"
import cctvVert from "./cctv.vert"

interface PostProcessingProps {
  mainTexture: Texture
}

const material = new ShaderMaterial({
  vertexShader: cctvVert,
  fragmentShader: cctvFrag,
  uniforms: {
    uMainTexture: { value: null },
    screenSize: { value: new Vector2(1, 1) },
    dpr: { value: 1 },
    aspect: { value: 1 },
    uTime: { value: 0 }
  }
})

export function CCTVEffect({ mainTexture }: PostProcessingProps) {
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = window.devicePixelRatio
      material.uniforms.screenSize.value.set(width, height)
      material.uniforms.dpr.value = dpr
      material.uniforms.aspect.value = width / height
    }

    resize()
    window.addEventListener("resize", resize, { signal })

    material.uniforms.uMainTexture.value = mainTexture

    return () => {
      controller.abort()
    }
  }, [mainTexture])

  const calculateFov = (z: number) => {
    return Math.atan(1 / z) * (180 / Math.PI)
  }

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <>
      <PerspectiveCamera
        manual
        position={[0, 0, 10]}
        aspect={1}
        fov={calculateFov(10)}
        ref={(r) => {
          if (r) useCameraStore.setState({ postProcessingCamera: r })
        }}
      />
      <mesh>
        <planeGeometry args={[1, 1]} />
        <primitive object={material} attach="material" />
      </mesh>
    </>
  )
}
