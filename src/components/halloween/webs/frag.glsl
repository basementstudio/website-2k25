uniform vec3 uColor;
uniform float uOpacity;
uniform float uLightFlicker;
uniform float uLightning;
uniform float fadeFactor;

varying vec3 vTangent;
varying vec3 vViewDir;
varying float vAcross;
varying float vHalfWidth;
varying float vCoverage;
varying float vOpacity;

// Silk is a thin cylinder: its highlight follows the thread (Kajiya-Kay)
// rather than sitting in one spot, which is what makes webs glint.
float sheen(vec3 light, float power) {
  vec3 halfDir = normalize(light + vViewDir);
  float th = dot(normalize(vTangent), halfDir);
  return pow(sqrt(max(1.0 - th * th, 0.0)), power);
}

void main() {
  float edge = 1.0 - smoothstep(vHalfWidth - 1.0, vHalfWidth, abs(vAcross));

  // The office lights hang overhead; lightning comes in through the front
  // windows (+z).
  float room = sheen(normalize(vec3(0.2, 1.0, 0.3)), 24.0) * uLightFlicker;
  float storm = sheen(normalize(vec3(0.0, 0.35, 1.0)), 10.0) * uLightning;

  vec3 color =
    uColor * (0.15 + 0.85 * uLightFlicker) +
    vec3(1.0, 0.95, 0.85) * room * 0.6 +
    vec3(0.6, 0.7, 1.0) * storm;
  // Nearly gone in a blackout, until a strike lights it up again.
  float alpha =
    uOpacity *
    vOpacity *
    ((0.45 + 0.55 * room) * (0.4 + 0.6 * uLightFlicker) + 0.5 * storm) *
    edge *
    vCoverage;

  // Darken with the rest of the scene while inspecting.
  gl_FragColor = vec4(color * (1.0 - fadeFactor), alpha);
}
