uniform float fadeFactor;
varying vec2 vUv;
varying float vLit;
void main() {
  float radius = length(vUv * 2.0 - 1.0);
  float glow = pow(max(0.0, 1.0 - radius), 2.0);
  gl_FragColor = vec4(
    1.0,
    0.32,
    0.045,
    glow * 0.22 * vLit * (1.0 - fadeFactor)
  );
}
