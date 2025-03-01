uniform sampler2D uNoise;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec2 steamUv = vUv;
  steamUv.x *= 0.5;
  steamUv.y *= 0.3;
  steamUv.y -= uTime * 0.015;

  float steam = texture(uNoise, steamUv).r;
  steam = smoothstep(0.45, 1.0, steam);

  // fade edges
  steam *= smoothstep(0.0, 0.15, vUv.x);
  steam *= 1.0 - smoothstep(0.85, 1.0, vUv.x);
  steam *= smoothstep(0.0, 0.15, vUv.y);
  steam *= 1.0 - smoothstep(0.85, 1.0, vUv.y);

  vec2 shiftedFragCoord = gl_FragCoord.xy + vec2(1.0);
  vec2 checkerPos = floor(shiftedFragCoord * 0.5);
  float pattern = mod(checkerPos.x + checkerPos.y, 2.0);

  vec3 baseColor = vec3(0.92, 0.78, 0.62);

  // mix steam with checker pattern
  float alpha = steam * pattern;

  // Apply vertical gradient
  float gradient = clamp(1.0 - vUv.y * 1.25 + 0.2, 0.0, 1.0);
  alpha *= gradient;

  vec4 color = vec4(baseColor, alpha);

  gl_FragColor = color;
}
