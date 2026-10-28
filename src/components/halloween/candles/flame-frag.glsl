uniform float fadeFactor;
varying vec2 vUv;
varying float vFlicker;

void main() {
  vec2 p = vec2((vUv.x - 0.5) * 2.0, vUv.y);
  float width = max(0.015, pow(1.0 - p.y, 0.8) * (0.22 + p.y * 0.55));
  float edge = abs(p.x) / width;
  float flame =
    (1.0 - smoothstep(0.65, 1.0, edge)) *
    smoothstep(0.0, 0.1, p.y) *
    (1.0 - smoothstep(0.8, 1.0, p.y));
  float core =
    (1.0 - smoothstep(0.0, 0.55, edge)) * (1.0 - smoothstep(0.25, 0.7, p.y));
  float halo = exp(
    -dot(
      vec2(p.x * 2.5, (p.y - 0.32) * 2.0),
      vec2(p.x * 2.5, (p.y - 0.32) * 2.0)
    ) *
      3.0
  );
  vec3 color = mix(vec3(2.8, 0.48, 0.035), vec3(4.0, 2.8, 1.1), core);
  float alpha = (flame + halo * 0.12) * vFlicker * (1.0 - fadeFactor);
  gl_FragColor = vec4(color, alpha);
}
