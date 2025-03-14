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

// Inspectable
uniform bool inspectingEnabled;
uniform float inspectingFactor;
uniform float fadeFactor;

// Lamp
uniform sampler2D lampLightmap;
uniform bool lightLampEnabled;

const float RECIPROCAL_PI = 1.0 / 3.14159265359;
#pragma glslify: valueRemap = require('../utils/value-remap.glsl')
#pragma glslify: basicLight = require('../utils/basic-light.glsl')

void main() {
  vec2 shiftedFragCoord = gl_FragCoord.xy + vec2(1.0);
  vec2 checkerPos = floor(shiftedFragCoord * 0.5);
  float pattern = mod(checkerPos.x + checkerPos.y, 2.0);

  // Render as solid color
  vec4 mapSample = vec4(1.0);

  // TODO: implement map matrix instead of mapRepeat
  #ifdef USE_MAP
  vec2 mapUv = (mapMatrix * vec3(vUv, 1.0)).xy;
  mapSample = texture2D(map, mapUv * mapRepeat);
  #endif

  // TODO: use map matrix to shift or move to a different shader to add lightning
  #ifdef CLOUDS
  mapSample = texture2D(map, vec2(vUv.x - uTime * 0.01, vUv.y));
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

  #ifdef USE_EMISSIVE
  float ei = emissiveIntensity;
  if (inspectingEnabled && !(inspectingFactor > 0.0)) {
    ei *= 1.0 - fadeFactor;
  }
  irradiance += emissive * ei;
  #endif

  #ifdef USE_EMISSIVEMAP
  float ei = emissiveIntensity;
  if (inspectingEnabled && !(inspectingFactor > 0.0)) {
    ei *= 1.0 - fadeFactor;
  }
  vec4 emissiveColor = texture2D(emissiveMap, vUv);
  irradiance *= emissiveColor.rgb * ei;
  #endif

  vec3 lf = irradiance.rgb;

  if (inspectingFactor > 0.0) {
    // Key light
    lf *= basicLight(vNormal, vViewDirection, 4.0);
    // Fill light
    vec3 fillLightDir = normalize(cross(vViewDirection, vec3(0.0, 1.0, 0.0)));
    lf *= basicLight(vNormal, fillLightDir, 2.0);
    // Rim light
    vec3 rimLightDir = normalize(-vViewDirection + vec3(0.0, 0.5, 0.0));
    lf *= basicLight(vNormal, rimLightDir, 3.0);

    #ifdef MATCAP
    vec3 x = normalize(vec3(-vViewDirection.z, 0.0, vViewDirection.x));
    vec3 y = cross(vViewDirection, x);
    vec2 muv =
      vec2(dot(x, normalize(vNormal)), dot(y, normalize(vNormal))) * 0.495 +
      0.5;
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

  irradiance = mix(irradiance, lf, inspectingFactor);

  float opacityResult = 1.0;
  opacityResult *= opacity;

  #ifdef IS_TRANSPARENT
  float mapAlpha = mapSample.a;
  opacityResult *= mapAlpha;
  #endif

  #ifdef USE_ALPHA_MAP
  vec2 alphaMapUv = (alphaMapTransform * vec3(vUv, 1.0)).xy;
  float alpha = texture2D(alphaMap, alphaMapUv).r;
  opacityResult *= alpha;
  #endif

  if (opacityResult <= 0.0) {
    discard;
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
  vec4 reflexSample = texture2D(
    glassReflex,
    vUv * 0.75 + vViewDirection.xy * vec2(-0.25, 0.25) + vec2(0.125)
  );
  if (reflexSample.a > 0.0) {
    gl_FragColor.rgb = mix(gl_FragColor.rgb, reflexSample.rgb, 0.075);
  }
  gl_FragColor.a *= pattern;
  #endif

  #ifdef GODRAY
  gl_FragColor.a *= pattern * uGodrayOpacity * uGodrayDensity;
  #endif

  // Fog
  #ifdef FOG
  float fogDepthValue = min(vMvPosition.z + fogDepth, 0.0);
  float fogFactor =
    1.0 - exp(-fogDensity * fogDensity * fogDepthValue * fogDepthValue);

  fogFactor = clamp(fogFactor, 0.0, 1.0);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
  #endif

  if (inspectingEnabled && !(inspectingFactor > 0.0)) {
    gl_FragColor.rgb *= 1.0 - fadeFactor;
  }

  #ifdef MATCAP
  if (glassMatcap) {
    gl_FragColor.a *= pattern * inspectingFactor;
  }
  #endif
}
