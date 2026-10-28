uniform float fadeFactor;
void main() {
  gl_FragColor = vec4(vec3(0.018, 0.016, 0.024) * (1.0 - fadeFactor), 1.0);
}
