precision highp float;

varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vWorldPosition;

const float voxelSize = 10.0;
const float noiseBigScale = 1.0;
const float noiseSmallScale = 3.0;

// base color
uniform vec3 uColor;
uniform vec3 baseColor;
uniform sampler2D map;
uniform vec2 mapRepeat;

// wave
uniform float uProgress;
uniform float metalness;
uniform float roughness;
uniform float uLoaded;
uniform float uTime;

// lightmap
uniform sampler2D lightMap;
uniform float lightMapIntensity;

uniform float noiseFactor;
uniform bool uReverse;

// transparency
uniform float opacity;
uniform sampler2D alphaMap;

// emissive
#ifdef USE_EMISSIVE
uniform vec3 emissive;
uniform float emissiveIntensity;
#endif

const float RECIPROCAL_PI = 1.0 / 3.14159265359;

#pragma glslify: _vModule = require('../utils/voxel.glsl', getVoxel = getVoxel, VoxelData = VoxelData)

void main() {
  VoxelData voxel = getVoxel(
    vWorldPosition,
    voxelSize,
    noiseBigScale,
    noiseSmallScale
  );

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

  vec4 mapSample = vec4(1.0);

  #ifdef USE_MAP
  mapSample = texture2D(map, vUv * mapRepeat);
  #endif

  // Combine texture and base color
  vec3 color = baseColor * mapSample.rgb;

  vec3 lightMapSample = texture2D(lightMap, vUv2).rgb;

  // Apply metalness to affect the reflection intensity
  vec3 metallicReflection = mix(vec3(0.04), color, metalness);

  // Combine base color, metallic reflection, and lightmap
  vec3 irradiance = mix(
    color * (1.0 - metalness), // Diffuse component
    metallicReflection * lightMapSample * (1.0 - roughness), // Metallic reflection with roughness
    metalness
  );

  #ifdef USE_EMISSIVE
  irradiance += emissive * emissiveIntensity;
  #endif

  // Adjust ambient light based on roughness
  float ambientFactor = mix(0.2, 0.4, roughness); // More ambient light for rougher surfaces

  if (lightMapIntensity > 0.0) {
    irradiance *= lightMapSample * lightMapIntensity;
  }

  // Combine wave color
  irradiance = mix(irradiance, uColor * wave + uColor * edge, wave + edge);

  // Reverse the opacity calculation and apply wave effect
  float opacityResult;

  opacityResult = 1.0 - wave;
  opacityResult *= opacity;
  irradiance = mix(irradiance, uColor, wave);

  #ifdef IS_TRANSPARENT
  float mapAlpha = mapSample.a;
  opacityResult *= mapAlpha;
  #endif

  #ifdef USE_ALPHA_MAP
  float alpha = texture2D(alphaMap, vUv).r;
  opacityResult *= alpha;
  #endif

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
