precision highp float;

varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vWorldPosition;

const float voxelSize = 10.0;
const float noiseBigScale = 1.0;
const float noiseSmallScale = 3.0;

uniform vec3 uColor;
uniform float uProgress;
uniform vec3 baseColor;
uniform sampler2D map;
uniform sampler2D lightMap;
uniform vec2 mapRepeat;
uniform float opacity;
uniform float noiseFactor;
uniform bool uReverse;
uniform float metalness;

uniform float uLoaded;
uniform float uTime;

#pragma glslify: noise = require('./noise3.glsl')

struct VoxelData {
  float edgeFactor;
  float fillFactor;
  vec3 center;
  float size;
  float noiseBig;
  float noiseSmall;
};

float isEdge(vec3 p) {
  float edgeLimit = 0.92;
  float zEdge = float(abs(p.z) * voxelSize * 2.0 > edgeLimit);
  float yEdge = float(abs(p.y) * voxelSize * 2.0 > edgeLimit);
  float xEdge = float(abs(p.x) * voxelSize * 2.0 > edgeLimit);

  float totalEdge = xEdge + yEdge + zEdge;
  return totalEdge >= 1.0
    ? 1.0
    : 0.0;
}

VoxelData getVoxel() {
  vec3 voxelCenter = round(vWorldPosition * voxelSize) / voxelSize;
  float noiseBig = noise(voxelCenter * noiseBigScale);
  float noiseSmall = noise(voxelCenter * noiseSmallScale);
  float edgeFactor = isEdge(voxelCenter - vWorldPosition);
  float fillFactor = 1.0 - edgeFactor;

  return VoxelData(
    edgeFactor,
    fillFactor,
    voxelCenter,
    voxelSize,
    noiseBig,
    noiseSmall
  );
}

void main() {
  VoxelData voxel = getVoxel();

  // Distance from center
  float dist = distance(voxel.center, vec3(2.0, 0.0, -16.0));

  float distantceOffset = voxel.noiseBig * noiseFactor;
  dist += distantceOffset * 2.0;

  // Wave effect
  float wave = step(dist, uProgress * 20.0);
  float edge = step(dist, uProgress * 20.0 + 0.2) - wave;

  // Render as wireframe
  if (uReverse) {
    gl_FragColor = vec4(uColor, 1.0);

    if (wave <= 0.0) {
      discard;
    }
    return;
  }

  // Render as solid color

  vec4 mapSample = texture2D(map, vUv * mapRepeat);
  // Combine texture and base color
  vec3 color = baseColor * mapSample.rgb;

  vec3 lightMapSample = texture2D(lightMap, vUv2).rgb;

  // Apply metalness to affect the reflection intensity
  vec3 metallicReflection = mix(vec3(0.04), color, metalness);

  // Combine base color, metallic reflection, and lightmap
  vec3 irradiance = mix(
    color * (1.0 - metalness), // Diffuse component
    metallicReflection * lightMapSample, // Metallic reflection
    metalness
  );

  // Add ambient light contribution
  irradiance += lightMapSample * (1.0 - metalness) * 0.2;

  // Combine wave color
  irradiance = mix(irradiance, uColor * wave + uColor * edge, wave + edge);

  // Reverse the opacity calculation and apply wave effect
  float opacityResult;

  opacityResult = 1.0 - wave;
  opacityResult *= opacity;
  irradiance = mix(irradiance, uColor, wave);

  if (opacityResult <= 0.0) {
    discard;
  }

  gl_FragColor = vec4(irradiance, opacityResult);

  if (uLoaded < 1.0) {
    // Loading effect
    float colorBump = (uTime + voxel.noiseBig * 20.0) * 0.1;
    colorBump = fract(colorBump) * 20.0;
    colorBump = clamp(colorBump, 0.0, 1.0);
    colorBump = 1.0 - pow(colorBump, 0.3);

    float loadingColor = max(
      voxel.edgeFactor * 0.2,
      colorBump * voxel.fillFactor * 3.0
    );

    gl_FragColor.rgb = mix(
      gl_FragColor.rgb,
      vec3(loadingColor),
      step(uLoaded, voxel.noiseSmall)
    );
  }

}
