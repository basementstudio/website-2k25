attribute vec2 uv1;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vMvPosition;
varying vec3 vNormal;

varying vec2 vUv2;

void main() {
  vUv = uv;
  vUv2 = uv1;

  vNormal = normalize(normalMatrix * normal);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);

  vMvPosition = mvPosition.xyz;
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}