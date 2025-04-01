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
uniform lowp sampler2D uPointLightPosition;
uniform lowp sampler2D uPointLightColor;
#endif

#ifdef USE_LIGHT
uniform vec4 uLightColor;
uniform vec4 uLightDirection;
uniform vec4 uPointLightPosition;
uniform vec4 uPointLightColor;
#endif

varying vec4 vLightColor;
varying vec4 vLightDirection;
varying vec4 vPointLightPosition;
varying vec4 vPointLightColor;

uniform sampler2D uMapOffset;
varying vec2 vMapOffset;
varying vec3 vWorldPosition;

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
  // light direction
  ivec2 lightDirectionCoord = getSampleCoord(uLightDirection, batchId);
  vLightDirection = texelFetch(uLightDirection, lightDirectionCoord, 0);
  // light color
  ivec2 lightColorCoord = getSampleCoord(uLightColor, batchId);
  vLightColor = texelFetch(uLightColor, lightColorCoord, 0);
  // point light position
  ivec2 pointLightPositionCoord = getSampleCoord(uPointLightPosition, batchId);
  vPointLightPosition = texelFetch(
    uPointLightPosition,
    pointLightPositionCoord,
    0
  );
  // point light color
  ivec2 pointLightColorCoord = getSampleCoord(uPointLightColor, batchId);
  vPointLightColor = texelFetch(uPointLightColor, pointLightColorCoord, 0);
  #endif

  #ifdef USE_LIGHT
  // light direction
  vLightDirection = uLightDirection;
  // light color
  vLightColor = uLightColor;
  // point light position
  vPointLightPosition = uPointLightPosition;
  // point light color
  vPointLightColor = uPointLightColor;
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
  vWorldPosition = (batchingMatrix * vec4(transformed, 1.0)).xyz;
  #include <project_vertex>
}
