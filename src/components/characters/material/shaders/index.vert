#include <common>
#include <batching_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <normal_pars_vertex>

#ifdef USE_MULTI_MAP
attribute float mapIndex;
varying float vMapIndex;
// uniform sampler2D map[MULTI_MAP_COUNT];
#endif

varying vec2 vUv;

void main() {
  vUv = uv;
  #ifdef USE_MULTI_MAP
  vMapIndex = mapIndex;
  #endif

  #include <batching_vertex>

  #ifdef USE_SKINNING
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <defaultnormal_vertex>
  #include <normal_vertex>
  #endif

  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>

  #include <project_vertex>
  // #include <worldpos_vertex>
}
