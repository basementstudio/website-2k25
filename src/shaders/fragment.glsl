varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vWorldPosition;

uniform vec3 uColor;
uniform float uProgress;
uniform vec3 baseColor;
uniform sampler2D map;
uniform sampler2D lightMap;
uniform vec2 mapRepeat;
uniform float opacity;
uniform float noiseFactor;
uniform bool uReverse;

#pragma glslify: noise = require('./noise3.glsl')

void main() {
  // Distance from center
  vec3 voxelCenter = round(vWorldPosition * 6.0) / 6.0;
  float randomOffset = noise(voxelCenter) * noiseFactor;

  float dist = distance(voxelCenter, vec3(2.0, 0.0, -16.0));
  dist += randomOffset * 2.0;

  // Wave effect
  float wave = step(dist, uProgress * 20.0);
  float edge = step(dist, uProgress * 20.0 + 0.2) - wave;

  vec4 mapSample = texture2D(map, vUv * mapRepeat);
  // Combine texture and base color
  vec3 color = baseColor * mapSample.rgb;

  vec3 lightMapSample = texture2D(lightMap, vUv2).rgb;

  vec3 irradiance = color + lightMapSample;

  // Combine wave color
  irradiance = mix(irradiance, uColor * wave + uColor * edge, wave + edge);

  // Reverse the opacity calculation and apply wave effect
  float opacityResult;
  if (uReverse) {
    opacityResult = wave;
    irradiance = mix(
      irradiance,
      vec3(1.0, 1.0, 1.0) * wave + vec3(1.0, 1.0, 1.0) * edge,
      wave + edge
    );
  } else {
    opacityResult = 1.0 - wave;
    irradiance = mix(irradiance, uColor, wave);
  }

  if (opacityResult <= 0.0) {
    discard;
  }

  gl_FragColor = vec4(irradiance, opacityResult);
}
