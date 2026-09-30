uniform vec3 uColor;
uniform float uOpacity;

void main() {
  if (uOpacity < 0.01) discard;
  gl_FragColor = vec4(uColor, uOpacity);
}
