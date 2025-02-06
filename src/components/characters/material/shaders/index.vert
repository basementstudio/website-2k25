#include <common>
#include <batching_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <normal_pars_vertex>

#ifdef USE_MULTI_MAP
// attribute float mapIndex;
varying float vMapIndex;

uniform usampler2D uMapIndex;
#endif

varying vec2 vUv;
varying vec3 vDebug;

ivec2 calcCoord(int size, int id) {
  int j = int(id);
  int x = j % size;
  int y = j / size;
  return ivec2(x, y);
}

ivec2 getSampleCoord(const sampler2D mapSampler, const float batchId) {
  int size = textureSize(mapSampler, 0).x;
  return calcCoord(size, int(batchId));
}

ivec2 getSampleCoord(const usampler2D mapSampler, const float batchId) {
  int size = textureSize(mapSampler, 0).x;
  return calcCoord(size, int(batchId));
}

void main() {
  vUv = uv;

  // batch Info
  float batchId = getIndirectIndex(gl_DrawID);

  #ifdef USE_MULTI_MAP

  ivec2 mapIndexCoord = getSampleCoord(uMapIndex, batchId);
  vMapIndex = float(texelFetch(uMapIndex, mapIndexCoord, 0).x);

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
