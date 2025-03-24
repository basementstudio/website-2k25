uniform sampler2D tDisplacement;
uniform float currentFrame;
uniform float totalFrames;
uniform float offsetScale;
uniform float vertexCount;

attribute vec2 uv1;

varying vec2 vUv;
varying vec2 vDisplacementUv;
varying vec3 displacement;

void main() {
  vUv = uv;

  vDisplacementUv = vec2(uv1.x, 1.0 - currentFrame / totalFrames);

  vec3 offset = texture2D(tDisplacement, vDisplacementUv).xzy;
  displacement = offset;

  offset *= offsetScale;
  vec3 newPosition = position + offset;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
