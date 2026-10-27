uniform float fadeFactor;
uniform float uLightFlicker;
uniform float uLightning;
varying vec2 vUv;
varying vec3 vGaze;

float ellipse(vec2 p, vec2 radius) {
  return 1.0 - smoothstep(0.86, 1.0, length(p / radius));
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float presence = 0.28 + vGaze.z * 0.72;
  // A face emerging out of the ink; the surrounding poster stays visible.
  float head = ellipse(p - vec2(0.0, 0.09), vec2(0.62, 0.66));
  float cheek = ellipse(p - vec2(0.0, -0.12), vec2(0.43, 0.38));
  vec3 color = vec3(0.018, 0.014, 0.021);
  float alpha = head * presence * 0.68;
  color += vec3(0.035, 0.023, 0.015) * cheek;
  // Both pupils share the same gaze, constrained inside almond eye sockets.
  for (int i = 0; i < 2; i++) {
    float side = float(i) * 2.0 - 1.0;
    vec2 eye = p - vec2(side * 0.22, 0.24);
    float socket = ellipse(eye, vec2(0.19, 0.13));
    float white = ellipse(eye, vec2(0.145, 0.07));
    vec2 pupil = eye - vGaze.xy * vec2(0.055, 0.026);
    float iris = ellipse(pupil, vec2(0.053, 0.058));
    float center = ellipse(pupil, vec2(0.023, 0.046));
    float glint = ellipse(pupil - vec2(-0.013, 0.019), vec2(0.009));
    color = mix(color, vec3(0.008, 0.004, 0.009), socket);
    vec3 eyeball = mix(vec3(0.6, 0.52, 0.34), vec3(0.65, 0.19, 0.025), iris);
    eyeball = mix(eyeball, vec3(0.009, 0.004, 0.002), center);
    eyeball += glint * 0.6;
    color = mix(
      color,
      eyeball * (0.45 + 0.55 * presence + uLightning * 0.3),
      white
    );
    alpha = max(alpha, socket * (0.45 + 0.5 * presence));
  }
  color *= 0.65 + 0.35 * uLightFlicker;
  float border =
    (1.0 - smoothstep(0.85, 1.0, abs(p.x))) *
    (1.0 - smoothstep(0.85, 1.0, abs(p.y)));
  gl_FragColor = vec4(color, alpha * border * (1.0 - fadeFactor));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
