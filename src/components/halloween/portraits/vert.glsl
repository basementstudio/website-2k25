attribute float aPortrait;
uniform vec3 uGaze[PORTRAIT_COUNT];
varying vec2 vUv;
varying vec3 vGaze;

void main() {
  vUv = uv;
  vGaze = uGaze[int(aPortrait)];
  gl_Position =
    projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
