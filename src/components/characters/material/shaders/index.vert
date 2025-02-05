#include <common>
#include <batching_pars_vertex>
#include <skinning_pars_vertex>

#ifdef USE_MULTI_MAP
attribute float mapIndex;
varying float vMapIndex;
// uniform sampler2D map[MULTI_MAP_COUNT];
#endif

varying vec2 vUv;

void main() {
  vUv = uv;

  #include <begin_vertex>
  #include <batching_vertex>

  #ifdef USE_SKINNING
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #endif

  #ifdef USE_MULTI_MAP
  vMapIndex = mapIndex;
  #endif

  #include <skinning_vertex>

  #include <project_vertex>
  #include <worldpos_vertex>
}
