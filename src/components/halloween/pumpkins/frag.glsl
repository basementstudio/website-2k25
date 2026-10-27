uniform float uTime;
uniform float uOpacity;
uniform float fadeFactor;
uniform float uLightFlicker;
uniform float uLightning;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vPart;
varying float vAwake;
varying float vFace;
varying vec3 vTint;

float edge(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  vec2 ap = p - a;
  return (ab.x * ap.y - ab.y * ap.x) / length(ab);
}

float triangle(vec2 p, vec2 a, vec2 b, vec2 c) {
  return min(edge(p, a, b), min(edge(p, b, c), edge(p, c, a)));
}

void main() {
  vec3 n = normalize(vNormal);
  float diffuse = 0.38 + 0.5 * max(dot(n, normalize(vec3(0.4, 0.8, 0.6))), 0.0);
  float grain = sin(vLocal.y * 135.0 + sin(vLocal.x * 72.0)) * 0.018;
  vec3 skin =
    vPart > 0.5
      ? vec3(0.13, 0.085, 0.025)
      : vTint + grain * vec3(1.0, 0.3, 0.1);
  vec3 color = skin * diffuse * (0.3 + 0.7 * uLightFlicker);
  float spec = pow(
    max(
      dot(n, normalize(normalize(vViewDir) + normalize(vec3(0.4, 1.0, 0.6)))),
      0.0
    ),
    24.0
  );
  color += vec3(0.1, 0.055, 0.012) * spec * uLightFlicker;
  color += skin * vec3(0.5, 0.65, 0.9) * uLightning;
  color += skin * vec3(0.2, 0.055, 0.005) * vAwake;

  // Signed shapes on the front hemisphere: dark cut edges around a warm
  // recessed face. No extra transparent planes or dynamic lights.
  if (vFace > -0.5 && vPart < 0.5 && vLocal.z > 0.22) {
    vec2 p = vLocal.xy;
    float leftEye = triangle(
      p,
      vec2(-0.35, 0.58),
      vec2(-0.1, 0.61),
      vec2(-0.21, 0.77)
    );
    float rightEye = triangle(
      p,
      vec2(0.1, 0.61),
      vec2(0.35, 0.58),
      vec2(0.21, 0.77)
    );
    float nose = triangle(
      p,
      vec2(-0.065, 0.48),
      vec2(0.065, 0.48),
      vec2(0.0, 0.57)
    );
    float mouthCenter = 0.31 + p.x * p.x * 0.65;
    float mouth = min(0.35 - abs(p.x), 0.055 - abs(p.y - mouthCenter));
    if (vFace > 0.5 && vFace < 1.5) {
      leftEye = triangle(
        p,
        vec2(-0.35, 0.69),
        vec2(-0.1, 0.58),
        vec2(-0.14, 0.74)
      );
      rightEye = triangle(
        p,
        vec2(0.1, 0.58),
        vec2(0.35, 0.69),
        vec2(0.14, 0.74)
      );
      mouthCenter = 0.3 + p.x * p.x * 0.45;
      mouth = min(0.37 - abs(p.x), 0.045 - abs(p.y - mouthCenter));
    } else if (vFace > 1.5) {
      leftEye =
        (1.0 - length((p - vec2(-0.2, 0.67)) / vec2(0.07, 0.09))) * 0.07;
      rightEye = triangle(
        p,
        vec2(0.1, 0.61),
        vec2(0.34, 0.69),
        vec2(0.18, 0.78)
      );
      mouthCenter = 0.31 + p.x * 0.18 + sin(p.x * 16.0) * 0.025;
      mouth = min(0.31 - abs(p.x), 0.048 - abs(p.y - mouthCenter));
    }
    // Two top teeth and one bottom tooth interrupt the grin.
    if (
      (abs(p.x - 0.13) < 0.035 || abs(p.x + 0.19) < 0.035) &&
      p.y > mouthCenter
    )
      mouth = -0.02;
    if (abs(p.x + 0.025) < 0.035 && p.y < mouthCenter - 0.005) mouth = -0.02;
    float cut = max(max(leftEye, rightEye), max(nose, mouth));
    float border = smoothstep(-0.015, -0.005, cut);
    float opening = smoothstep(0.002, 0.015, cut);
    float flicker =
      0.91 +
      0.06 * sin(uTime * 7.1 + gl_FragCoord.x * 0.003) +
      0.03 * sin(uTime * 13.7);
    color = mix(color, vec3(0.055, 0.009, 0.001), border);
    color = mix(
      color,
      vec3(2.4, 0.63, 0.055) * flicker * (1.0 + vAwake * 1.8),
      opening
    );
  }
  gl_FragColor = vec4(color * (1.0 - fadeFactor), uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
