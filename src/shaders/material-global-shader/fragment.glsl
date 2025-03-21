precision highp float;

varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vWorldPosition;
varying vec3 vMvPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;

// base color
uniform vec3 uColor;
uniform vec3 baseColor;
uniform sampler2D map;
uniform mat3 mapMatrix;
uniform vec2 mapRepeat;

// other
uniform float uTime;

// lightmap
uniform sampler2D lightMap;
uniform float lightMapIntensity;

// lights
#ifdef LIGHT
uniform vec3 lightDirection;
#endif

#ifdef BASKETBALL
uniform vec3 backLightDirection;
#endif

// aomap
uniform sampler2D aoMap;
uniform float aoMapIntensity;

uniform float noiseFactor;
uniform bool uReverse;

// transparency
uniform float opacity;
uniform sampler2D alphaMap;
uniform mat3 alphaMapTransform;

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
#ifdef FOG
uniform vec3 fogColor;
uniform float fogDensity;
uniform float fogDepth;
#endif

// Matcap
#ifdef MATCAP
uniform sampler2D matcap;
uniform bool glassMatcap;
#endif

// Glass
#ifdef GLASS
uniform sampler2D glassReflex;
#endif

// Godray
#ifdef GODRAY
uniform float uGodrayOpacity;
uniform float uGodrayDensity;
#endif

// Daylight
#ifdef DAYLIGHT
uniform bool daylight;
#endif

// Inspectable
uniform bool inspectingEnabled;
uniform float inspectingFactor;
uniform float fadeFactor;

// Lamp
uniform sampler2D lampLightmap;
uniform bool lightLampEnabled;

#pragma glslify: valueRemap = require('../utils/value-remap.glsl')
#pragma glslify: basicLight = require('../utils/basic-light.glsl')

void main() {
  // Precompute normalized vectors
  vec3 normalizedNormal = normalize(vNormal);
  vec3 normalizedViewDir = normalize(vViewDirection);

  // Precompute frequently used values
  float oneMinusFadeFactor = 1.0 - fadeFactor;
  bool isInspectionMode = inspectingFactor > 0.0;
  bool shouldFade = inspectingEnabled && !isInspectionMode;

  // Precompute transformed UV coordinates used in multiple places
  #ifdef USE_MAP
  // Precalculate UV transformation for the map
  vec2 mapUv = (mapMatrix * vec3(vUv, 1.0)).xy * mapRepeat;
  #endif

  #ifdef USE_ALPHA_MAP
  // Precalculate UV transformation for the alpha map
  vec2 alphaMapUv = (alphaMapTransform * vec3(vUv, 1.0)).xy;
  #endif

  // Render as solid color
  vec4 mapSample = vec4(1.0);

  // Use precomputed coordinates
  #ifdef USE_MAP
  mapSample = texture2D(map, mapUv);
  #endif

  // TODO: use map matrix to shift or move to a different shader to add lightning
  #ifdef CLOUDS
  mapSample = texture2D(map, vec2(vUv.x - uTime * 0.004, vUv.y));
  #endif

  // Combine texture and base color
  vec3 color = baseColor * mapSample.rgb;

  vec3 lightMapSample = vec3(0.0);

  if (lightLampEnabled) {
    lightMapSample = texture2D(lampLightmap, vUv2).rgb;
  } else {
    lightMapSample = texture2D(lightMap, vUv2).rgb;
  }

  vec3 irradiance = color;

  // Common calculation for emissive - simplified using precomputed values
  #if defined(USE_EMISSIVE) || defined(USE_EMISSIVEMAP)
  float ei = emissiveIntensity;
  if (shouldFade) {
    ei *= oneMinusFadeFactor;
  }
  #endif

  #ifdef USE_EMISSIVE
  irradiance += emissive * ei;
  #endif

  #ifdef USE_EMISSIVEMAP
  vec4 emissiveColor = texture2D(emissiveMap, vUv);
  irradiance *= emissiveColor.rgb * ei;
  #endif

  vec3 lf = irradiance.rgb;

  if (isInspectionMode) {
    // Key light
    lf *= basicLight(normalizedNormal, normalizedViewDir, 4.0);
    // Fill light
    vec3 fillLightDir = normalize(
      cross(normalizedViewDir, vec3(0.0, 1.0, 0.0))
    );
    lf *= basicLight(normalizedNormal, fillLightDir, 2.0);
    // Rim light
    vec3 rimLightDir = normalize(-normalizedViewDir + vec3(0.0, 0.5, 0.0));
    lf *= basicLight(normalizedNormal, rimLightDir, 3.0);

    #ifdef MATCAP
    // Precompute constant vector and avoid reconstruction
    vec3 nvz = vec3(-normalizedViewDir.z, 0.0, normalizedViewDir.x);
    vec3 x = normalize(nvz);
    vec3 y = cross(normalizedViewDir, x);

    // Use precomputed constants to avoid repeated multiplications and additions
    // 0.495 + 0.5 simplified
    vec2 muv =
      vec2(dot(x, normalizedNormal), dot(y, normalizedNormal)) * 0.495 + 0.5;

    lf *= texture2D(matcap, muv).rgb;
    #endif
  }

  #ifndef VIDEO
  if (lightMapIntensity > 0.0) {
    irradiance *= lightMapSample * lightMapIntensity;
  }
  #endif

  if (aoMapIntensity > 0.0) {
    float ambientOcclusion =
      (texture2D(aoMap, vUv2).r - 1.0) * aoMapIntensity + 1.0;

    irradiance *= ambientOcclusion;
  }

  // Optimize mixing based on inspectingFactor
  // Avoid mix() call when not necessary
  if (isInspectionMode) {
    // Only mix when inspectingFactor is not 1.0
    if (inspectingFactor < 1.0) {
      irradiance =
        irradiance * (1.0 - inspectingFactor) + lf * inspectingFactor;
    } else {
      irradiance = lf; // If inspectingFactor is 1.0, just use lf
    }
  }
  // If inspectingFactor is 0.0, irradiance already has the correct value

  float opacityResult = 1.0;
  opacityResult *= opacity;

  #ifdef IS_TRANSPARENT
  float mapAlpha = mapSample.a;
  opacityResult *= mapAlpha;
  #endif

  #ifdef USE_ALPHA_MAP
  float alpha = texture2D(alphaMap, alphaMapUv).r;
  opacityResult *= alpha;
  #endif

  if (opacityResult <= 0.0) {
    discard;
  }

  #ifdef LIGHT
  // Calculate light factor with dotNL
  float dotNL = dot(lightDirection, normalizedNormal);

  // Simplify remapping: valueRemap(x, in_min, in_max, out_min, out_max) = (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
  // For valueRemap(dotNL, 0.2, 1.0, 0.1, 1.0) we can precalculate:
  // factor = (out_max - out_min) / (in_max - in_min) = (1.0 - 0.1) / (1.0 - 0.2) = 0.9 / 0.8 = 1.125
  // lightFactor = (dotNL - 0.2) * 1.125 + 0.1
  float lightFactor = (dotNL - 0.2) * 1.125 + 0.1;
  lightFactor = clamp(lightFactor, 0.0, 1.0);
  lightFactor = lightFactor * lightFactor;

  #ifdef BASKETBALL
  // Apply the same principle for backLightFactor
  float dotBackNL = dot(backLightDirection, normalizedNormal);
  // For valueRemap(dotBackNL, 0.05, 1.0, 0.1, 1.0):
  // factor = (1.0 - 0.1) / (1.0 - 0.05) = 0.9 / 0.95 = 0.947368
  float backLightFactor = (dotBackNL - 0.05) * 0.947368 + 0.1;
  backLightFactor = clamp(backLightFactor, 0.0, 1.0);
  backLightFactor = backLightFactor * backLightFactor;

  // Precalculate coefficients
  // 8.0 * backLightFactor * 1.5 = 12.0 * backLightFactor
  lightFactor *= 8.0;
  backLightFactor *= 4.0;

  lightFactor = max(lightFactor, backLightFactor * 1.5);
  #else
  lightFactor *= 3.0;
  #endif

  lightFactor += 1.0;
  irradiance *= lightFactor;
  #endif

  gl_FragColor = vec4(irradiance, opacityResult);

  // Pattern calculation - Only for cases that can be verified at precompilation
  #if defined(GLASS) || defined(GODRAY) || defined(MATCAP) && defined(GLASS)
  // Only calculate the pattern when needed
  vec2 shiftedFragCoord = gl_FragCoord.xy + vec2(1.0);
  vec2 checkerPos = floor(shiftedFragCoord * 0.5);
  float pattern = mod(checkerPos.x + checkerPos.y, 2.0);
  #endif

  // For MATCAP and glassMatcap, calculate pattern at runtime
  #ifdef MATCAP
  // Only if glassMatcap is true and we haven't calculated the pattern yet
  #if !defined(GLASS) && !defined(GODRAY)
  float pattern;
  if (glassMatcap) {
    vec2 shiftedFragCoord = gl_FragCoord.xy + vec2(1.0);
    vec2 checkerPos = floor(shiftedFragCoord * 0.5);
    pattern = mod(checkerPos.x + checkerPos.y, 2.0);
  }
  #endif
  #endif

  #ifdef GLASS
  // Precalculated constants for UV transformation
  const vec2 glassScale = vec2(0.75);
  const vec2 glassOffset = vec2(0.125);
  const vec2 viewDirScale = vec2(-0.25, 0.25);
  const float mixFactor = 0.075; // Constant mix factor

  // Simplify UV coordinates calculation
  vec2 glassUv =
    vUv * glassScale + normalizedViewDir.xy * viewDirScale + glassOffset;
  vec4 reflexSample = texture2D(glassReflex, glassUv);

  // Optimize conditional mixing
  if (reflexSample.a > 0.0) {
    // Direct mixing using the form: result = a * (1-t) + b * t
    gl_FragColor.rgb =
      gl_FragColor.rgb * (1.0 - mixFactor) + reflexSample.rgb * mixFactor;
  }
  gl_FragColor.a *= pattern;
  #endif

  #ifdef GODRAY
  gl_FragColor.a *= pattern * uGodrayOpacity * uGodrayDensity;
  #endif

  // Fog - optimize mix() when fogFactor is extreme
  #ifdef FOG
  float fogDepthValue = min(vMvPosition.z + fogDepth, 0.0);
  float fogDepthSquared = fogDepthValue * fogDepthValue;
  float fogDensitySquared = fogDensity * fogDensity;
  float fogFactor = 1.0 - exp(-fogDensitySquared * fogDepthSquared);

  fogFactor = clamp(fogFactor, 0.0, 1.0);

  // Optimize mixing to avoid unnecessary calculations
  if (fogFactor > 0.0) {
    if (fogFactor < 1.0) {
      gl_FragColor.rgb =
        gl_FragColor.rgb * (1.0 - fogFactor) + fogColor * fogFactor;
    } else {
      gl_FragColor.rgb = fogColor; // If fogFactor is 1.0, use fogColor directly
    }
  }
  // If fogFactor is 0.0, there's no change to gl_FragColor.rgb
  #endif

  // Apply fade effect just before final modifiers
  if (shouldFade) {
    gl_FragColor.rgb *= oneMinusFadeFactor;
  }

  #ifdef MATCAP
  if (glassMatcap) {
    gl_FragColor.a *= pattern * inspectingFactor;
  }
  #endif

  #ifdef DAYLIGHT
  if (daylight) {
    gl_FragColor.a = inspectingFactor;
  }
  #endif
}
