import { OrthographicCamera } from "@react-three/drei"
import { useControls } from "leva"
import { useEffect } from "react"
import { ShaderMaterial, Texture, Vector2 } from "three"

import { useCameraStore } from "@/store/app-store"

import postFrag from "./post.frag"
import postVert from "./post.vert"

interface PostProcessingProps {
  mainTexture: Texture
}

const material = new ShaderMaterial({
  vertexShader: postVert,
  fragmentShader: postFrag,
  uniforms: {
    uMainTexture: { value: null },
    uEnableShader: { value: false },
    aspect: { value: 1 },
    resolution: { value: new Vector2(1, 1) },
    uPalette: { value: null },
    uPixelSize: { value: 2.0 },
    uBias: { value: 0.0 },
    uColorMultiplier: { value: 1.0 },
    uNoiseFactor: { value: 0.0 },
    uBloomStrength: { value: 0.9 },
    uBloomRadius: { value: 10 },
    uBloomThreshold: { value: 1.5 },

    // adjustments
    uContrast: { value: 1 },
    uExposure: { value: 1.2 },
    uGamma: { value: 2.2 },
    uBrightness: { value: 1 }
  }
})

export function PostProcessing({ mainTexture }: PostProcessingProps) {
  useControls("basics", {
    contrast: {
      value: 1.02,
      min: 0.0,
      max: 2.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uContrast.value = value
      }
    },
    brightness: {
      value: 0.31,
      min: 0.0,
      max: 2.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uBrightness.value = value
      }
    },
    exposure: {
      value: 0.54,
      min: 0.0,
      max: 4.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uExposure.value = value
      }
    },
    gamma: {
      value: 0.73,
      min: 0.0,
      max: 2.2,
      step: 0.01,
      onChange(value) {
        material.uniforms.uGamma.value = value
      }
    }
  })

  useControls("bloom", {
    bloomThreshold: {
      value: 3,
      min: 0.0,
      max: 10.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uBloomThreshold.value = value
      }
    },
    bloomStrength: {
      value: 0.05,
      min: 0.0,
      max: 2.0,
      step: 0.01,
      onChange(value) {
        material.uniforms.uBloomStrength.value = value
      }
    },
    bloomRadius: {
      value: 8.0,
      min: 1.0,
      max: 32.0,
      step: 1,
      onChange(value) {
        material.uniforms.uBloomRadius.value = value
      }
    }
  })

  useControls("dither", {
    pixelSize: {
      value: 2.0,
      min: 1.0,
      max: 300.0,
      step: 1,
      onChange(value) {
        material.uniforms.uPixelSize.value = value
      }
    }
    // bias: {
    //   value: 0.39,
    //   min: 0.0,
    //   max: 1.0,
    //   step: 0.01,
    //   onChange(value) {
    //     material.uniforms.uBias.value = value
    //   }
    // },
    // colorMultiplier: {
    //   value: 0.26,
    //   min: 0.0,
    //   max: 1.0,
    //   step: 0.01,
    //   onChange(value) {
    //     material.uniforms.uColorMultiplier.value = value
    //   }
    // },
    // noiseFactor: {
    //   value: 0.17,
    //   min: 0.0,
    //   max: 2.0,
    //   step: 0.01,
    //   onChange(value) {
    //     material.uniforms.uNoiseFactor.value = value
    //   }
    // }
  })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const resize = () => {
      const pixelRatio = window.devicePixelRatio
      const width = window.innerWidth
      const height = window.innerHeight
      material.uniforms.resolution.value.set(width, height)
    }

    resize()
    window.addEventListener("resize", resize, { signal })

    material.uniforms.uMainTexture.value = mainTexture
    return () => {
      controller.abort()
    }
  }, [mainTexture])

  return (
    <>
      <OrthographicCamera
        manual
        position={[0, 0, 1]}
        left={-0.5}
        right={0.5}
        top={0.5}
        bottom={-0.5}
        near={0.1}
        far={1000}
        ref={(r) => {
          // @ts-ignore
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
