#include <common>
#include <morphtarget_pars_vertex>

attribute vec2 uv1;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vMvPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec2 vUv2;

void main() {
  vUv = uv;
  vUv2 = uv1.x > 0.0 ? uv1 : uv;

  // Normal (morph-aware). No normal morph targets are exported, so the chunk is a
  // no-op for morphed meshes, but it keeps the standard three.js chunk flow.
  vec3 objectNormal = normal;
  #include <morphnormal_vertex>
  vNormal = normalize(normalMatrix * objectNormal);

  // Position, deformed by morph targets when the geometry has them
  // (arcade buttons / joysticks on SM_Controls). Guarded by USE_MORPHTARGETS.
  vec3 transformed = position;
  #include <morphtarget_vertex>

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);

  // Calculate view direction in view space
  vViewDirection = normalize(-mvPosition.xyz);

  vMvPosition = mvPosition.xyz;
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
