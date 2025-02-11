attribute vec2 uv1;

uniform float uJitter;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vMvPosition;
varying vec3 vNormal;

varying vec2 vUv2;

void main() {
  vUv = uv;
  vUv2 = uv1;

  // Transform normal to world space for correct lighting
  vNormal = normalize(normalMatrix * normal);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);

  vMvPosition = mvPosition.xyz;
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;

  // gl_Position.xy /= gl_Position.w;
  // gl_Position.xy = floor(gl_Position.xy * uJitter) / uJitter * gl_Position.w;

}
