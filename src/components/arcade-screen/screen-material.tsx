import { ShaderMaterial, Vector3 } from "three"

import screenFragmentShader from "./fragment.glsl"
import screenVertexShader from "./vertex.glsl"

export const screenMaterial = new ShaderMaterial({
  vertexShader: screenVertexShader,
  fragmentShader: screenFragmentShader,
  uniforms: {
    map: { value: null },
    reflectionMap: { value: null },
    reflectionOpacity: { value: 0.5 },
    uColorNum: { value: 16.0 },
    uPixelSize: { value: 1024.0 },
    uTime: { value: 0 },
    uNoiseIntensity: { value: 0.05 },
    uScanlineIntensity: { value: 0.25 },
    uScanlineFrequency: { value: 10.0 },
    uIsMonochrome: { value: false },
    uMonochromeColor: { value: new Vector3(1.0, 0.5, 0.0) }
  }
})
