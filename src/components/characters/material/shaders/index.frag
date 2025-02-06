varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vDebug;

#ifdef USE_MULTI_MAP
struct MapConfig {
  sampler2D map;
  mat3 mapTransform;
};
uniform MapConfig mapConfigs[MULTI_MAP_COUNT];
varying float vMapIndex;

vec4 sampleConfigMap(int index) {
  return texture2D(mapConfigs[index].map, (mapConfigs[index].mapTransform * vec3(vUv, 1.0)).xy);
}
#endif

vec3 light = normalize(vec3(-0.2, 1, 1.));

vec3 gamma(vec3 color, float gamma) {
  return pow(color, vec3(gamma));
}

float valueRemap(float value, float min, float max, float newMin, float newMax) {
  return newMin + (value - min) * (newMax - newMin) / (max - min);
}

void main() {
  vec3 color = vec3(0.0);

  #ifdef USE_MULTI_MAP //support only 4 maps
      #if MULTI_MAP_COUNT >= 1
      if (vMapIndex < 0.5) color = sampleConfigMap(0).rgb;
      #endif
      #if MULTI_MAP_COUNT >= 2
      else if (vMapIndex < 1.5) color = sampleConfigMap(1).rgb;
      #endif
      #if MULTI_MAP_COUNT >= 3
      else if (vMapIndex < 2.5) color = sampleConfigMap(2).rgb;
      #endif
      #if MULTI_MAP_COUNT >= 4
      else if (vMapIndex < 3.5) color = sampleConfigMap(3).rgb;
      #endif
  #endif

  color = gamma(color, 2.2);

  float lightIntensity = dot(light, normalize(vNormal));
  lightIntensity = valueRemap(lightIntensity, -0.5, 1.0, 0.0, 1.0);
  lightIntensity = clamp(lightIntensity, 0.0, 1.0);
  lightIntensity *= 2.;
  // ambient light
  lightIntensity += 0.5;

  color *= lightIntensity;


  gl_FragColor = vec4(vec3(color), 1.0);

  // gl_FragColor = vec4(vDebug, 1.0);
}
