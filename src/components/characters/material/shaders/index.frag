varying vec2 vUv;
varying vec3 vNormal;

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

vec3 light = normalize(vec3(0.1, 0.3, 1.0));

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

  float lightIntensity = dot(light, normalize(vNormal));

  color *= lightIntensity;


  gl_FragColor = vec4(color, 1.0);
}
