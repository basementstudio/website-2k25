attribute vec2 uv1;

varying vec2 vUv;
varying vec3 vWorldPosition;

varying vec2 vUv2;

void main() {
  vUv = uv;
  vUv2 = uv1;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;

  gl_Position.xy /= gl_Position.w;
  float scale = 680.0;
  gl_Position.xy = floor(gl_Position.xy * scale) / scale * gl_Position.w;
}
