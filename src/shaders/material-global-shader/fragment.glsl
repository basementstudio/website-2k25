precision highp float;
#define GLSLIFY 1

varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vWorldPosition;
varying vec3 vMvPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;

// Base color
uniform vec3 uColor;
uniform vec3 baseColor;
uniform sampler2D map;
uniform mat3 mapMatrix;
uniform vec2 mapRepeat;

// Other
uniform float uTime;

// Lightmap
uniform sampler2D lightMap;
uniform float lightMapIntensity;

// Lights
#ifdef LIGHT
uniform vec3 lightDirection;
#endif

#ifdef BASKETBALL
uniform vec3 backLightDirection;
#endif

// AOMap
uniform sampler2D aoMap;
uniform float aoMapIntensity;

uniform float noiseFactor;
uniform bool uReverse;

// Transparency
uniform float opacity;
uniform sampler2D alphaMap;
uniform mat3 alphaMapTransform;

// Emissive
#if defined(USE_EMISSIVE) || defined(USE_EMISSIVEMAP)
uniform vec3 emissive;
uniform float emissiveIntensity;
#endif

#ifdef USE_EMISSIVEMAP
uniform sampler2D emissiveMap;
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

float valueRemap(float value, float min, float max) {
  return (value - min) / (max - min);
}

float valueRemap(
  float value,
  float min,
  float max,
  float newMin,
  float newMax
) {
  return (value - min) / (max - min) * (newMax - newMin) + newMin;
}

vec2 valueRemap(vec2 value, vec2 min, vec2 max, vec2 newMin, vec2 newMax) {
  return vec2(
    valueRemap(value.x, min.x, max.x, newMin.x, newMax.x),
    valueRemap(value.y, min.y, max.y, newMin.y, newMax.y)
  );
}

vec3 valueRemap(vec3 value, vec3 min, vec3 max, vec3 newMin, vec3 newMax) {
  return vec3(
    valueRemap(value.x, min.x, max.x, newMin.x, newMax.x),
    valueRemap(value.y, min.y, max.y, newMin.y, newMax.y),
    valueRemap(value.z, min.z, max.z, newMin.z, newMax.z)
  );
}

float basicLight(vec3 normal, vec3 lightDir, float intensity) {
  float lightFactor = dot(lightDir, normalize(normal));
  lightFactor = valueRemap(lightFactor, 0.2, 1.0, 0.1, 1.0);
  lightFactor = clamp(lightFactor, 0.0, 1.0);
  lightFactor = pow(lightFactor, 2.0);
  lightFactor *= intensity;
  lightFactor += 1.0;

  return lightFactor;
}

void main() {
  vec3 normalizedNormal = normalize(vNormal);
  vec3 normalizedViewDir = normalize(vViewDirection);

  float oneMinusFadeFactor = 1.0 - fadeFactor;
  bool isInspectionMode = inspectingFactor > 0.0;
  bool shouldFade = inspectingEnabled && !isInspectionMode;

  #ifdef USE_MAP
  vec2 mapUv = (mapMatrix * vec3(vUv, 1.0)).xy * mapRepeat;
  #endif

  #ifdef USE_ALPHA_MAP
  vec2 alphaMapUv = (alphaMapTransform * vec3(vUv, 1.0)).xy;
  #endif

  vec4 mapSample = vec4(1.0);

  #ifdef USE_MAP
  mapSample = texture2D(map, mapUv);
  #endif

  #ifdef CLOUDS
  mapSample = texture2D(map, vec2(vUv.x - uTime * 0.004, vUv.y));
  #endif

  vec3 color = baseColor * mapSample.rgb;

  vec3 lightMapSample = vec3(0.0);

  if (lightLampEnabled) {
    lightMapSample = texture2D(lampLightmap, vUv2).rgb;
  } else {
    lightMapSample = texture2D(lightMap, vUv2).rgb;
  }

  vec3 irradiance = color;

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
  #ifdef VIDEO
  // Video screens reuse the same texture for map + emissiveMap and rely on
  // this self-multiply to punch up brightness/contrast — keep as-is.
  irradiance *= emissiveColor.rgb * ei;
  #else
  // Pure-emissive surfaces (baked light atlases, neon, etc.) are authored
  // with baseColorFactor near black — multiplying would zero them out, so
  // add the emissive contribution instead, same as the non-mapped path above.
  // Also tint by the material's emissiveFactor (the "emissive" uniform),
  // same as three.js's standard material — lets a warm/colored tint be set
  // in Blender on top of a neutral mask texture without touching the shader.
  irradiance += emissiveColor.rgb * emissive * ei;
  #endif
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
    vec3 nvz = vec3(-normalizedViewDir.z, 0.0, normalizedViewDir.x);
    vec3 x = normalize(nvz);
    vec3 y = cross(normalizedViewDir, x);

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

  if (isInspectionMode) {
    if (inspectingFactor < 1.0) {
      irradiance =
        irradiance * (1.0 - inspectingFactor) + lf * inspectingFactor;
    } else {
      irradiance = lf;
    }
  }

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
  float dotNL = dot(lightDirection, normalizedNormal);

  float lightFactor = (dotNL - 0.2) * 1.125 + 0.1;
  lightFactor = clamp(lightFactor, 0.0, 1.0);
  lightFactor = lightFactor * lightFactor;

  #ifdef BASKETBALL
  float dotBackNL = dot(backLightDirection, normalizedNormal);
  float backLightFactor = (dotBackNL - 0.05) * 0.947368 + 0.1;
  backLightFactor = clamp(backLightFactor, 0.0, 1.0);
  backLightFactor = backLightFactor * backLightFactor;

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

  #if defined(GLASS) || defined(GODRAY) || defined(MATCAP) && defined(GLASS)

  vec2 shiftedFragCoord = gl_FragCoord.xy + vec2(2.0);
  vec2 checkerPos = floor(shiftedFragCoord * 0.5);
  float pattern = mod(checkerPos.x + checkerPos.y, 2.0);
  #endif

  #ifdef MATCAP

  #if !defined(GLASS) && !defined(GODRAY)
  float pattern;
  if (glassMatcap) {
    vec2 shiftedFragCoord = gl_FragCoord.xy + vec2(2.0);
    vec2 checkerPos = floor(shiftedFragCoord * 0.5);
    pattern = mod(checkerPos.x + checkerPos.y, 2.0);
  }
  #endif
  #endif

  #ifdef GLASS

  const vec2 glassScale = vec2(0.75);
  const vec2 glassOffset = vec2(0.125);
  const vec2 viewDirScale = vec2(-0.25, 0.25);
  const float mixFactor = 0.075;

  vec2 glassUv =
    vUv * glassScale + normalizedViewDir.xy * viewDirScale + glassOffset;
  vec4 reflexSample = texture2D(glassReflex, glassUv);

  if (reflexSample.a > 0.0) {
    gl_FragColor.rgb =
      gl_FragColor.rgb * (1.0 - mixFactor) + reflexSample.rgb * mixFactor;
  }
  gl_FragColor.a *= pattern;
  #endif

  #ifdef GODRAY
  gl_FragColor.a *= pattern * uGodrayOpacity * uGodrayDensity;
  #endif

  #ifdef FOG
  float fogDepthValue = min(vMvPosition.z + fogDepth, 0.0);
  float fogDepthSquared = fogDepthValue * fogDepthValue;
  float fogDensitySquared = fogDensity * fogDensity;
  float fogFactor = 1.0 - exp(-fogDensitySquared * fogDepthSquared);

  fogFactor = clamp(fogFactor, 0.0, 1.0);

  if (fogFactor > 0.0) {
    if (fogFactor < 1.0) {
      gl_FragColor.rgb =
        gl_FragColor.rgb * (1.0 - fogFactor) + fogColor * fogFactor;
    } else {
      gl_FragColor.rgb = fogColor;
    }
  }
  #endif

  #ifdef IS_LOBO_MARINO
  vec3 currentColor = gl_FragColor.rgb;
  float fresnelFactor = pow(
    1.0 - dot(normalizedViewDir, normalizedNormal),
    1.0
  );
  vec3 col = mix(uColor, currentColor, 0.5);
  col = mix(col, col * 4.0, fresnelFactor);
  gl_FragColor.rgb = col;
  #endif

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
