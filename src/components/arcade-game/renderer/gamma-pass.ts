import { ShaderMaterial } from "three"
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

  float gamma = 2.2;

  vec3 color = pow(mainSample.rgb, vec3(1.0 / gamma));

  gl_FragColor = vec4(color, 1.0);
}
`
const gammaMaterial = new ShaderMaterial({
  vertexShader: drawVertexShader,
  fragmentShader: drawFragmentShader,
})

export const gammaPass = new ShaderPass(gammaMaterial as any)
