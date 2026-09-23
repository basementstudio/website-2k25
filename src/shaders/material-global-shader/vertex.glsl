#include <common>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>

attribute vec2 uv1;
#ifdef LIGHTMAP_ATLAS
// 3rd UV set (TEXCOORD_2) — this mesh's placement in the shared lightmap
// atlas. Meshes still on their own dedicated sheet (e.g. the blog lamp)
// don't have this attribute and keep sampling uv1 below.
attribute vec2 uv2;
#endif

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vMvPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec2 vUv2;

void main() {
  vUv = uv;
  #ifdef LIGHTMAP_ATLAS
  vUv2 = uv2;
  #else
  vUv2 = uv1.x > 0.0 ? uv1 : uv;
  #endif

  // Normal (morph- and skin-aware). No normal morph targets are exported,
  // so that chunk is a no-op for morphed meshes, but it keeps the standard
  // three.js chunk flow. USE_SKINNING is set automatically by three.js for
  // any SkinnedMesh (e.g. SM_Octocat's wiggle-bone rig) — no defines needed
  // here, same as USE_MORPHTARGETS below.
  vec3 objectNormal = normal;
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  vNormal = normalize(normalMatrix * objectNormal);

  // Position, deformed by morph targets when the geometry has them
  // (arcade buttons / joysticks on SM_Controls) and then by skinning when
  // it's a SkinnedMesh. Guarded by USE_MORPHTARGETS / USE_SKINNING.
  vec3 transformed = position;
  #include <morphtarget_vertex>
  #include <skinning_vertex>

  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
  vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);

  // Calculate view direction in view space
  vViewDirection = normalize(-mvPosition.xyz);

  vMvPosition = mvPosition.xyz;
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
