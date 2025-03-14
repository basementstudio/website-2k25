varying vec2 vUv;
varying vec3 vNormal;
varying vec2 vMapOffset;
varying vec3 vDebug;
varying vec4 vLightColor;
varying vec4 vLightDirection;

#ifdef USE_MULTI_MAP
struct MapConfig {
  sampler2D map;
  mat3 mapTransform;
};
uniform MapConfig mapConfigs[MULTI_MAP_COUNT];
varying float vMapIndex;

vec4 sampleConfigMap(sampler2D map, mat3 mapTransform) {
  vec2 mapUv = (mapTransform * vec3(vUv, 1.0)).xy;
  mapUv += vMapOffset;
  return texture2D(map, mapUv);
}
#endif

vec3 gamma(vec3 color, float gamma) {
  return pow(color, vec3(gamma));
}

float valueRemap(float value, float min, float max, float newMin, float newMax) {
  return newMin + (value - min) * (newMax - newMin) / (max - min);
}

void main() {
  vec3 color = vec3(0.0);

  vec4 mapSample = vec4(0.0);
  float alpha = 1.0;
  #ifdef USE_MULTI_MAP //support only 4 maps
      #if MULTI_MAP_COUNT >= 1
      if (vMapIndex < 0.5) mapSample = sampleConfigMap(mapConfigs[0].map, mapConfigs[0].mapTransform);
      #endif
      #if MULTI_MAP_COUNT >= 2
      else if (vMapIndex < 1.5) mapSample = sampleConfigMap(mapConfigs[1].map, mapConfigs[1].mapTransform);
      #endif
      #if MULTI_MAP_COUNT >= 3
      else if (vMapIndex < 2.5) mapSample = sampleConfigMap(mapConfigs[2].map, mapConfigs[2].mapTransform);
      #endif
      #if MULTI_MAP_COUNT >= 4
      else if (vMapIndex < 3.5) mapSample = sampleConfigMap(mapConfigs[3].map, mapConfigs[3].mapTransform);
      #endif

    color = mapSample.rgb;
    alpha *= mapSample.a;
  #endif

  color = gamma(color, 2.2);

  float lightIntensity = dot(vLightDirection.xyz, normalize(vNormal));
  lightIntensity = valueRemap(lightIntensity, -0.5, 1.0, 0.0, 1.0);
  lightIntensity = clamp(lightIntensity, 0.0, 1.0);
  lightIntensity *= 2.;
  // ambient light
  lightIntensity += 0.1;

  color *= lightIntensity;
  color *= (vLightColor.rgb * vLightColor.a);

  if(alpha < 0.8) discard;

  gl_FragColor = vec4(vec3(color), 1.);

  // gl_FragColor = vec4(vDebug, 1.0);
}
