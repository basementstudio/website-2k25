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

  vNormal = normalize(normalMatrix * normal);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);

  // Calculate view direction in view space
  vViewDirection = normalize(-mvPosition.xyz);

  vMvPosition = mvPosition.xyz;
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
