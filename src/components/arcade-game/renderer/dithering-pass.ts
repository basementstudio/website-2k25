import { ShaderMaterial } from "three";
import { ShaderPass } from "postprocessing";

// Vertex shader remains the same
const drawVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position = vec4(position, 1.0);
}
`;

const drawFragmentShader = /* glsl */ `
varying vec2 vUv;

uniform highp sampler2D mainFbo;

// Bayer matrix for 4x4 dithering
const float bayerMatrix[16] = float[16](
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
);

const float PIXEL_SIZE = .5; // Size of the pixelated effect
const float DITHER_INTENSITY = 0.01; // Intensity of the dithering effect

void main() {
  vec4 mainSample = texture2D(mainFbo, vUv);

  // Apply gamma correction
  float gamma = 2.2;
  vec3 color = pow(mainSample.rgb, vec3(1.0 / gamma));

  // Group pixels into blocks and apply 4x4 Bayer matrix for dithering
  int x = int(mod(gl_FragCoord.x / PIXEL_SIZE, 4.0));
  int y = int(mod(gl_FragCoord.y / PIXEL_SIZE, 4.0));
  float threshold = bayerMatrix[y * 4 + x] / 16.0;

  // Apply subtle dithering to each color component
  color.r = color.r + (color.r > threshold ? DITHER_INTENSITY : -DITHER_INTENSITY);
  color.g = color.g + (color.g > threshold ? DITHER_INTENSITY : -DITHER_INTENSITY);
  color.b = color.b + (color.b > threshold ? DITHER_INTENSITY : -DITHER_INTENSITY);

  gl_FragColor = vec4(color, 1.0);
}
`;

const ditheringMaterial = new ShaderMaterial({
  vertexShader: drawVertexShader,
  fragmentShader: drawFragmentShader,
  uniforms: {
  },
});

export const ditheringPass = new ShaderPass(ditheringMaterial as any);
