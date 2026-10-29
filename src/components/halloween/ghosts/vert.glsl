uniform float uTime;
uniform float uSeed;
uniform vec2 uPointer;
uniform float uHover;
uniform vec2 uDrag;
uniform float uTouchMotion;

#include <common>
#include <skinning_pars_vertex>

varying vec3 vLocal;
varying vec2 vClothUv;
varying vec3 vWorldPosition;
varying vec3 vViewDir;
varying vec3 vViewNormal;
varying float vContact;

void main() {
  vec3 p = position;
  // Preserve the folds, eye openings and hem authored in the GLB.
  // A hand presses into an oval patch of fabric and drags it along the
  // stroke. The soft ridge around it is displaced cloth, not a travelling
  // wave. The head stays anchored and the rear layer remains undisturbed.
  vec2 contact = position.xy - uPointer;
  vec2 footprint = contact / vec2(0.2, 0.24);
  float cloth = 1.0 - smoothstep(0.65, 0.82, position.y);
  float front = smoothstep(-0.02, 0.12, position.z);
  float strength = cloth * front * uHover;
  float pressure = exp(-dot(footprint, footprint) * 1.6) * strength;
  float crease = exp(-pow((length(contact) - 0.23) / 0.085, 2.0)) * strength;
  p.z -= (pressure * 0.095 - crease * 0.012) * uTouchMotion;
  p.xy += uDrag * pressure * uTouchMotion;
  vContact = pressure;

  vec3 transformed = p;
  vec3 objectNormal = normal;
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <skinning_vertex>
  vec4 world = modelMatrix * vec4(transformed, 1.0);
  // Features and weave stay attached to the fabric as it bends.
  vLocal = position;
  vClothUv = uv;
  vWorldPosition = world.xyz;
  vViewDir = normalize(cameraPosition - world.xyz);
  vViewNormal = normalize(normalMatrix * objectNormal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
