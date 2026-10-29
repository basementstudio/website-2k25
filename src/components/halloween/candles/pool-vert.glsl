attribute float aLit;
varying float vLit;
varying vec2 vUv;
void main() {
  vUv = uv;
  vLit = aLit;
  gl_Position =
    projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
