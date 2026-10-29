#include <common>
#include <morphtarget_pars_vertex>

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vAssetColor;

void main() {
  vUv = uv;
  #ifdef USE_COLOR
  vAssetColor = color;
  #else
  vAssetColor = vec3(1.0);
  #endif
  #include <morphinstance_vertex>
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  vec4 world = modelMatrix * vec4(transformed, 1.0);
  vNormal = normalize(mat3(modelMatrix) * objectNormal);
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
