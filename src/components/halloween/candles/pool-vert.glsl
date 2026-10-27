varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position =
    projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
