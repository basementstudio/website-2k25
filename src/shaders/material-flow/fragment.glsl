precision highp float;
#define GLSLIFY 1

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

//
// GLSL textureless classic 2D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-08-22
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/ashima/webgl-noise
//

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec2 fade(vec2 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec2 P)
{
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod289(Pi); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;

  vec4 i = permute(permute(ix) + iy);

  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
  vec4 gy = abs(gx) - 0.5 ;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;

  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);

  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;

  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));

  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

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

  float noise = cnoise(pixel);

  if(finalSample.g > 2. + 1. * noise) {
    finalSample.g = 1000.;
  }

  // Average the samples for a basic diffusion effect
  return finalSample;
}

void main() {
  if (uFrame < 3) {
    fragColor = vec4(vec3(3., 100000., 0.), 1.0);
    return;
  }

  vec2 uv = vUv;
  vec2 p = vec2(0.5) - uv;
  p *= -2.0;
  
  vec4 expandedSample = samplePrev(uv);
  vec3 color = expandedSample.rgb;

  float circle = circleSdf(p, uMousePosition, 0.01);

  if(circle < 0. && uMouseMoving > 0.) {
    color.r = uMouseDepth;
    color.g = 0.;
  }

  fragColor = vec4(color, 1.0);
}
