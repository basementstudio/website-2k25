precision highp float;

in vec2 vUv;
in vec2 vFlowSize;
in vec2 dxy;

out vec4 fragColor;

uniform vec2 uMousePosition;
uniform float uMouseDepth;
uniform float uRenderCount;
uniform sampler2D uFeedbackTexture;
uniform int uFrame;
uniform float uMouseMoving;

#pragma glslify: cnoise2 = require(glsl-noise/classic/2d)

float circleSdf(vec2 pos, vec2 center, float radius) {
  return length(pos - center) - radius;
}

float valueRemap(float value, float min, float max, float newMin, float newMax) {
  return newMin + (newMax - newMin) * (value - min) / (max - min);
}

const int gridSize = 3;


// FLOW CHANNELS
// r - depht of pointer
// g - growth of wave
// b - power of wave

vec4 samplePrev(vec2 uv) {
  // Convert UV coordinates to pixel coordinates
  vec2 resolution = vec2(textureSize(uFeedbackTexture, 0));
  vec2 pixel = uv * resolution;

  vec4 samples[5];
  
  // Sample center and neighboring pixels
  vec4 p00 = textureLod(uFeedbackTexture, uv, 0.0);
  vec4 p10 = textureLod(uFeedbackTexture, uv + vec2(0.0, -1.0) / resolution, 0.0);
  vec4 p01 = textureLod(uFeedbackTexture, uv + vec2(-1.0, 0.0) / resolution, 0.0);
  vec4 p21 = textureLod(uFeedbackTexture, uv + vec2(1.0, 0.0) / resolution, 0.0);
  vec4 p12 = textureLod(uFeedbackTexture, uv + vec2(0.0, 1.0) / resolution, 0.0);

  samples[0] = p00;
  samples[1] = p10;
  samples[2] = p01;
  samples[3] = p21;
  samples[4] = p12;

  vec4 finalSample = p00;
  bool changed = false;

  for (int i = 1; i < 5; i++) {
    if(samples[i].g < finalSample.g && samples[i].g < 1.) {
      finalSample = samples[i];
      changed = true;
    }
  }
  finalSample.g += 0.02;

  float noise = cnoise2(pixel);

  if(finalSample.g > 2. + 1. * noise) {
    finalSample.g = 1000.;
  }

  // Average the samples for a basic diffusion effect
  return finalSample;
}

void main() {
  // if (uFrame < 3) {
  //   fragColor = vec4(vec3(0.0, 0., 0.), 1.0);
  //   return;
  // }

  vec2 uv = vUv;
  vec2 p = vec2(0.5) - uv;
  p *= -2.0;
  
  vec4 expandedSample = samplePrev(uv);
  vec3 color = expandedSample.rgb;

  float circle = circleSdf(p, uMousePosition, 0.005);

  if(circle < 0. && uMouseMoving > 0.) {
    color.r = uMouseDepth;
    color.g = 0.;
  }

  fragColor = vec4(color, 1.0);
}
