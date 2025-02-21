import { ShaderMaterial, Texture } from "three"
import { Uniforms } from "../../../../hooks/use-uniforms";
import { ShaderPass } from "postprocessing";

const drawVertexShader = /*glsl*/`
varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position = vec4(position, 1.0);
}
`

const drawFragmentShader = /*glsl*/`
varying vec2 vUv;

uniform highp sampler2D mainFbo;
void main() {

  vec4 mainSample = texture2D(mainFbo, vUv);

  vec3 color = mainSample.rgb;

  gl_FragColor = vec4(color, 1.0);
}
`

export type DrawUniforms = {
  mainFbo: Texture | null
};

export const defaultDrawUniforms: DrawUniforms = {
  mainFbo: null,
};

const getDrawPass = () => {
  const uniforms: Uniforms<DrawUniforms> = {
    mainFbo: { value: null },
  }

  const drawMaterial = new ShaderMaterial({
    vertexShader: drawVertexShader,
    fragmentShader: drawFragmentShader,
    uniforms
  })

  const shaderPass = new ShaderPass(drawMaterial as any)

  return [shaderPass, drawMaterial] as const
}

export const [drawPass, drawMaterial] = getDrawPass();
