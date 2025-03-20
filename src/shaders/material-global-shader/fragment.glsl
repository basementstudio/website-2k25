precision highp float;

varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vWorldPosition;
varying vec3 vMvPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;

uniform vec3 baseColor;
uniform sampler2D map;
uniform mat3 mapMatrix;
uniform vec2 mapRepeat;

uniform float uTime;
uniform sampler2D lightMap;
uniform float lightMapIntensity;

#ifdef LIGHT
uniform vec3 lightDirection;
#endif

#ifdef BASKETBALL
uniform vec3 backLightDirection;
#endif

uniform sampler2D aoMap;
uniform float aoMapIntensity;

uniform float opacity;
uniform sampler2D alphaMap;
uniform mat3 alphaMapTransform;

#ifdef USE_EMISSIVE
uniform vec3 emissive;
uniform float emissiveIntensity;
#endif

#ifdef USE_EMISSIVEMAP
uniform sampler2D emissiveMap;
uniform float emissiveIntensity;
#endif

#ifdef FOG
uniform vec3 fogColor;
uniform float fogDensity;
uniform float fogDepth;
#endif

#ifdef MATCAP
uniform sampler2D matcap;
uniform bool glassMatcap;
#endif

#ifdef GLASS
uniform sampler2D glassReflex;
#endif

#ifdef GODRAY
uniform float uGodrayOpacity;
uniform float uGodrayDensity;
#endif

#ifdef DAYLIGHT
uniform bool daylight;
#endif

uniform bool inspectingEnabled;
uniform float inspectingFactor;
uniform float fadeFactor;

uniform sampler2D lampLightmap;
uniform bool lightLampEnabled;

const float RECIPROCAL_PI = 0.31830988618;
#pragma glslify: valueRemap = require('../utils/value-remap.glsl')
#pragma glslify: basicLight = require('../utils/basic-light.glsl')

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDirection);

  vec2 mapUv = (mapMatrix * vec3(vUv, 1.0)).xy;

  #ifdef CLOUDS
  mapUv.x -= uTime * 0.004;
  #endif

  vec4 mapSample = texture2D(map, mapUv * mapRepeat);
  vec3 irradiance = baseColor * mapSample.rgb;

  vec3 lightMapSample = lightLampEnabled
    ? texture2D(lampLightmap, vUv2).rgb
    : texture2D(lightMap, vUv2).rgb;

  float fadeMult =
    inspectingEnabled && inspectingFactor <= 0.0
      ? 1.0 - fadeFactor
      : 1.0;

  #ifdef USE_EMISSIVE
  irradiance += emissive * emissiveIntensity * fadeMult;
  #endif

  #ifdef USE_EMISSIVEMAP
    float ei = emissiveIntensity;
    if (inspectingEnabled && !(inspectingFactor > 0.0)) {
      ei *= 1.0 - fadeFactor;
    }
    vec4 emissiveColor = texture2D(emissiveMap, vUv);
    irradiance *= emissiveColor.rgb * ei; 
  #endif

  vec3 lf = irradiance;

  if (inspectingFactor > 0.0) {
    lf *= basicLight(normal, viewDir, 4.0);
    lf *= basicLight(
      normal,
      normalize(cross(viewDir, vec3(0.0, 1.0, 0.0))),
      2.0
    );
    lf *= basicLight(normal, normalize(-viewDir + vec3(0.0, 0.5, 0.0)), 3.0);

    #ifdef MATCAP
    vec3 x = normalize(vec3(-viewDir.z, 0.0, viewDir.x));
    vec3 y = cross(viewDir, x);
    vec2 muv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5;
    lf *= texture2D(matcap, muv).rgb;
    #endif
  }

  #ifndef VIDEO
  if (lightMapIntensity > 0.0) irradiance *= lightMapSample * lightMapIntensity;
  #endif

  if (aoMapIntensity > 0.0)
    irradiance *= (texture2D(aoMap, vUv2).r - 1.0) * aoMapIntensity + 1.0;

  irradiance = mix(irradiance, lf, inspectingFactor);

  float opacityResult = opacity;
  #ifdef IS_TRANSPARENT
  opacityResult *= mapSample.a;
  #endif

  #ifdef USE_ALPHA_MAP
  opacityResult *= texture2D(
    alphaMap,
    (alphaMapTransform * vec3(vUv, 1.0)).xy
  ).r;
  #endif

  if (opacityResult <= 0.0) discard;

  #ifdef LIGHT
  float lightFactor = clamp(
    valueRemap(dot(lightDirection, normal), 0.2, 1.0, 0.1, 1.0),
    0.0,
    1.0
  );
  lightFactor *= lightFactor;

  #ifdef BASKETBALL
  float backLightFactor = clamp(
    valueRemap(dot(backLightDirection, normal), 0.05, 1.0, 0.1, 1.0),
    0.0,
    1.0
  );
  backLightFactor *= backLightFactor;
  lightFactor = max(lightFactor * 8.0, backLightFactor * 6.0);
  #else
  lightFactor *= 3.0;
  #endif

  irradiance *= lightFactor + 1.0;
  #endif

  gl_FragColor = vec4(irradiance, opacityResult);

  #if defined(GLASS) ||                                                          \
    defined(GODRAY) ||                                                         \
    defined(MATCAP) && defined(glassMatcap)
  float pattern = mod(
    floor((gl_FragCoord.x + gl_FragCoord.y + 1.0) * 0.5),
    2.0
  );
  #endif

  #ifdef GLASS
  vec4 reflexSample = texture2D(
    glassReflex,
    vUv * 0.75 + viewDir.xy * vec2(-0.25, 0.25) + 0.125
  );
  if (reflexSample.a > 0.0)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, reflexSample.rgb, 0.075);
  gl_FragColor.a *= pattern;
  #endif

  #ifdef GODRAY
  gl_FragColor.a *= pattern * uGodrayOpacity * uGodrayDensity;
  #endif

  #ifdef FOG
  float fogAmount = fogDensity * min(vMvPosition.z + fogDepth, 0.0);
  fogAmount *= fogAmount;
  gl_FragColor.rgb = mix(
    gl_FragColor.rgb,
    fogColor,
    clamp(1.0 - exp(-fogAmount), 0.0, 1.0)
  );
  #endif

  if (inspectingEnabled && inspectingFactor <= 0.0)
    gl_FragColor.rgb *= 1.0 - fadeFactor;

  #ifdef MATCAP
  if (glassMatcap) gl_FragColor.a *= pattern * inspectingFactor;
  #endif

  #ifdef DAYLIGHT
  if (daylight) gl_FragColor.a = inspectingFactor;
  #endif
}
