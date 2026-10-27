uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uSeed;
uniform float uLightFlicker;
uniform float uLightning;

varying vec3 vLocal;
varying vec3 vWorldPosition;
varying vec3 vViewDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
      mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x),
      f.y
    ),
    mix(
      mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
      mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x),
      f.y
    ),
    f.z
  );
}

// Inside an ellipse centred at c with radii r, on the ghost's front (+Z):
// 1 in the middle, easing to 0 at the rim.
float feature(vec2 c, vec2 r) {
  float d = length((vLocal.xy - c) / r);
  return (1.0 - smoothstep(0.75, 1.0, d)) * step(0.0, vLocal.z);
}

void main() {
  // Shade the moving folds themselves, rather than the undeformed lathe.
  vec3 n = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
  if (dot(n, vViewDir) < 0.0) n = -n;
  float fresnel = pow(1.0 - abs(dot(n, vViewDir)), 2.0);

  // A continuous, translucent cotton surface. Side light catches the
  // creases, while a fine stationary weave keeps it from reading as smoke.
  float weave = noise(vLocal * 95.0 + uSeed * 13.0);
  float light = max(dot(n, normalize(vec3(-0.5, 0.85, 0.65))), 0.0);
  float transmission = max(dot(-n, normalize(vec3(-0.5, 0.85, 0.65))), 0.0);
  vec3 color = uColor * (0.45 + light * 0.55 + transmission * 0.12);
  color += uColor * fresnel * 0.22;
  color *= 0.96 + weave * 0.08;
  float alpha = 0.24 + light * 0.09 + fresnel * 0.13;
  alpha *= smoothstep(-0.035, 0.065, vLocal.y) * 0.6 + 0.4;

  // Two oval holes in the sheet; no hood around the face.
  vec2 eye = vec2(0.029, 0.046);
  float eyes = max(
    feature(vec2(0.062, 0.835), eye),
    feature(vec2(-0.062, 0.835), eye)
  );
  color = mix(color, vec3(0.012, 0.016, 0.025), eyes * 0.96);
  alpha = max(alpha, eyes * 0.62);

  // They're the one light left when the power goes out, and lightning
  // shines straight through them.
  color *= 1.0 + (1.0 - uLightFlicker) * 0.8;
  alpha *= 1.0 - clamp(uLightning, 0.0, 1.0) * 0.6;

  gl_FragColor = vec4(color, alpha * uOpacity);
}
