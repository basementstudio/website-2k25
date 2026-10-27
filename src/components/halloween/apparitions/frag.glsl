uniform float uTime;
uniform float fadeFactor;
#ifdef SCREEN
uniform float uScreenPresence;
#else
uniform float uShadowPresence;
#endif
varying vec2 vUv;

float ellipse(vec2 p, vec2 radius) {
  return 1.0 - smoothstep(0.85, 1.0, length(p / radius));
}

void main() {
  vec2 p = vUv - 0.5;
  float grain = fract(
    sin(dot(floor(vUv * 180.0), vec2(12.9898, 78.233))) * 43758.5453
  );
  #ifdef SCREEN
  // Low contrast and a single slow fade, not a bright flash or strobe.
  float head = ellipse(p - vec2(0.0, 0.01), vec2(0.26, 0.43));
  float eyes = max(
    ellipse(p - vec2(-0.095, 0.12), vec2(0.045, 0.019)),
    ellipse(p - vec2(0.095, 0.12), vec2(0.045, 0.019))
  );
  float mouth = ellipse(p - vec2(0.0, -0.12), vec2(0.026, 0.11));
  float scan = 0.85 + 0.15 * sin(vUv.y * 280.0 - uTime * 2.0);
  vec3 color = vec3(0.11, 0.13, 0.14) * (0.75 + grain * 0.3) * scan;
  color = mix(color, vec3(0.004), mouth);
  color = mix(color, vec3(0.3, 0.32, 0.29), eyes);
  gl_FragColor = vec4(color, head * uScreenPresence * 0.9 * (1.0 - fadeFactor));
  #else
  float head = ellipse(p - vec2(0.01, 0.31), vec2(0.13, 0.12));
  float shoulders = ellipse(p - vec2(0.0, 0.15), vec2(0.29, 0.13));
  float robe = ellipse(p - vec2(-0.025, -0.07), vec2(0.23, 0.37));
  float silhouette = max(head, max(shoulders, robe));
  float fray = 0.7 + grain * 0.3;
  float edge =
    silhouette * (1.0 - ellipse(p - vec2(0.0, 0.0), vec2(0.17, 0.32)));
  vec3 color = vec3(0.04, 0.045, 0.06) + edge * vec3(0.075, 0.08, 0.09);
  gl_FragColor = vec4(
    color,
    silhouette * fray * uShadowPresence * 0.75 * (1.0 - fadeFactor)
  );
  #endif
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
