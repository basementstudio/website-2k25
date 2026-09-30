uniform vec3 uColor;
uniform vec3 uEyeColor;
uniform float fadeFactor;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vPart;

void main() {
  vec3 n = normalize(vNormal);
  // Cheap sheen so the black body still reads against dark walls.
  float rim = pow(1.0 - max(dot(n, vViewDir), 0.0), 3.0);
  vec3 halfDir = normalize(vViewDir + vec3(0.3, 1.0, 0.2));
  float spec = pow(max(dot(n, halfDir), 0.0), 24.0);
  vec3 color = uColor * (0.6 + 0.4 * n.y) + rim * 0.12 + spec * 0.08;

  if (vPart < -1.5) color = uEyeColor;

  // Darken with the rest of the scene while inspecting.
  gl_FragColor = vec4(color * (1.0 - fadeFactor), 1.0);
}
