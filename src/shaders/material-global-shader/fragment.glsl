precision highp float;

varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vWorldPosition;
varying vec3 vMvPosition;
varying vec3 vNormal;

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

// lights
#ifdef LIGHT
uniform vec3 lightDirection;
#endif

// aomap
uniform sampler2D aoMap;
uniform float aoMapIntensity;

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

#ifdef USE_EMISSIVEMAP
uniform sampler2D emissiveMap;
uniform float emissiveIntensity;
#endif

// Fog
uniform vec3 fogColor;
uniform float fogDensity;
uniform float fogDepth;

// Glass
#ifdef GLASS
uniform sampler2D glassReflex;
#endif

// Godray
#ifdef GODRAY
uniform float uGodrayOpacity;
uniform float uGodrayDensity;
#endif

const float RECIPROCAL_PI = 1.0 / 3.14159265359;

#pragma glslify: _vModule = require('../utils/voxel.glsl', getVoxel = getVoxel, VoxelData = VoxelData)
#pragma glslify: valueRemap = require('../utils/value-remap.glsl')

void main() {
  vec2 shiftedFragCoord = gl_FragCoord.xy + vec2(1.0);
  vec2 checkerPos = floor(shiftedFragCoord * 0.5);
  float pattern = mod(checkerPos.x + checkerPos.y, 2.0);

  VoxelData voxel = getVoxel(vWorldPosition, voxelSize, noiseBigScale, noiseSmallScale);

  // Distance from center
  float dist = distance(voxel.center, vec3(2.0, 0.0, -16.0));

  float distantceOffset = voxel.noiseBig * noiseFactor;
  dist += distantceOffset * 2.0;

  // Wave effect
  float wave = step(dist, uProgress * 20.0);
  float edge = step(dist, uProgress * 20.0 + 0.2) - wave;

  // Render as wireframe
  if(uReverse) {
    gl_FragColor = vec4(uColor, 1.0);

    if(wave <= 0.0) {
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
  vec3 irradiance = mix(color * (1.0 - metalness), // Diffuse component
  metallicReflection * lightMapSample * (1.0 - roughness), // Metallic reflection with roughness
  metalness);

  #ifdef USE_EMISSIVE
  irradiance += emissive * emissiveIntensity;
  #endif

  #ifdef USE_EMISSIVEMAP
  vec4 emissiveColor = texture2D(emissiveMap, vUv);
  irradiance *= emissiveColor.rgb * emissiveIntensity;
  #endif


  if(lightMapIntensity > 0.0) {
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

  if(opacityResult <= 0.0) {
    discard;
  }

  if(aoMapIntensity > 0.0) {
    float ambientOcclusion = (texture2D(aoMap, vUv2).r - 1.0) * aoMapIntensity + 1.0;
    irradiance *= ambientOcclusion;
  }

  #ifdef LIGHT
  float lightFactor = dot(lightDirection, normalize(vNormal));
  lightFactor = valueRemap(lightFactor, 0.2, 1.0, 0.1, 1.0);
  lightFactor = clamp(lightFactor, 0.0, 1.0);
  lightFactor = pow(lightFactor, 2.0);
  lightFactor *= 3.0;
  lightFactor += 1.0;
  irradiance *= lightFactor;
  #endif

  gl_FragColor = vec4(irradiance, opacityResult);

  #ifdef GLASS
  // TODO: when implementing parallax and multiple reflections, add controls in basehub to resize the reflection map
  vec4 reflexSample = texture2D(glassReflex, vUv * vec2(0.75, 1.0));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, reflexSample.rgb, 0.1);
  gl_FragColor.a *= pattern;
  #endif

  #ifdef GODRAY
  gl_FragColor.a *= pattern * uGodrayOpacity * uGodrayDensity;
  #endif

  // Fog
  float fogDepthValue = min(vMvPosition.z + fogDepth, 0.0);
  float fogFactor = 1.0 -
    exp(-fogDensity *
    fogDensity *
    fogDepthValue *
    fogDepthValue);

  fogFactor = clamp(fogFactor, 0.0, 1.0);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);

  if(uLoaded < 1.0) {
    // Loading effect
    float colorBump = (uTime + voxel.noiseBig * 20.0) * 0.1;
    colorBump = fract(colorBump) * 20.0;
    colorBump = clamp(colorBump, 0.0, 1.0);
    colorBump = 1.0 - pow(colorBump, 0.3);

    float loadingColor = max(voxel.edgeFactor * 0.2, colorBump * voxel.fillFactor * 3.0);

    gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(loadingColor), step(uLoaded, voxel.noiseSmall));
  }
}
