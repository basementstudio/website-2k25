#include <common>
#include <batching_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <normal_pars_vertex>

#ifdef USE_MULTI_MAP
varying float vMapIndex;
uniform sampler2D uMapIndex;
#endif

#ifdef USE_INSTANCED_LIGHT
uniform lowp sampler2D uLightColor;
uniform lowp sampler2D uLightDirection;
#endif

#ifdef USE_LIGHT
uniform vec4 uLightColor;
uniform vec4 uLightDirection;
#endif

varying vec4 vLightColor;
varying vec4 vLightDirection;

uniform sampler2D uMapOffset;
varying vec2 vMapOffset;

varying vec2 vUv;
varying vec3 vDebug;

void main() {
  vUv = uv;
  #include <morphinstance_vertex>

  // batch Info
  float batchId = getIndirectIndex(gl_DrawID);

  // multi map select
  #ifdef USE_MULTI_MAP
  ivec2 mapIndexCoord = getSampleCoord(uMapIndex, batchId);
  vMapIndex = float(texelFetch(uMapIndex, mapIndexCoord, 0).x);
  #endif

  // map offset for selecting submaps
  ivec2 mapOffsetCoord = getSampleCoord(uMapOffset, batchId);
  vMapOffset = texelFetch(uMapOffset, mapOffsetCoord, 0).xy;

  // light direction and color
  #ifdef USE_INSTANCED_LIGHT
  ivec2 lightDirectionCoord = getSampleCoord(uLightDirection, batchId);
  vLightDirection = texelFetch(uLightDirection, lightDirectionCoord, 0);
  ivec2 lightColorCoord = getSampleCoord(uLightColor, batchId);
  vLightColor = texelFetch(uLightColor, lightColorCoord, 0);
  #endif

  #ifdef USE_LIGHT
  vLightDirection = uLightDirection;
  vLightColor = uLightColor;
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
