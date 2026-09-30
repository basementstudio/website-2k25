uniform float uTime;
uniform float uSeed;
// 1 = lights on, 0 = power cut. The candle inside shines harder in the dark.
uniform float uLightFlicker;

varying vec3 vLocal;
varying vec3 vNormalW;

// Isoceles triangle: apex up, base at y = 0, height h, half-width w.
float triangle(vec2 p, float w, float h) {
  float t = clamp(p.y / h, 0.0, 1.0);
  return step(0.0, p.y) * step(p.y, h) * step(abs(p.x), w * (1.0 - t));
}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 dir = normalize(vLocal);

  // Carved face on the +z side.
  vec2 f = vLocal.xy;
  float front = smoothstep(0.15, 0.4, dir.z);
  vec2 e = vec2(abs(f.x) - 0.32, f.y - 0.06);
  float eyes = triangle(e, 0.14, 0.2);
  float nose = triangle(vec2(f.x, -(f.y + 0.12)), 0.07, 0.11);
  float curve = f.y + 0.3 - 0.9 * f.x * f.x;
  float tooth = step(0.35, fract(f.x * 4.2 + 0.5));
  float mouth =
    step(abs(f.x), 0.5) * step(abs(curve), 0.075) * mix(1.0, tooth, 0.6);
  float carved = clamp(eyes + nose + mouth, 0.0, 1.0) * front;

  float flicker =
    0.85 +
    0.15 * sin(uTime * 9.0 + uSeed * 30.0) * sin(uTime * 3.7 + uSeed * 11.0);
  float dark = 1.0 + (1.0 - uLightFlicker) * 1.4;
  vec3 glow = vec3(1.0, 0.42, 0.06) * 2.2 * flicker * dark;

  // Rind: a dim orange, lit a little from above and by the candle's spill.
  float shade = 0.3 + 0.35 * max(n.y, 0.0) + 0.2 * (n.z * 0.5 + 0.5);
  vec3 rind = vec3(0.85, 0.28, 0.03) * shade * mix(0.35, 1.0, uLightFlicker);
  rind += vec3(1.0, 0.4, 0.05) * 0.18 * flicker * front * (1.0 - carved);

  gl_FragColor = vec4(mix(rind, glow, carved), 1.0);
}
