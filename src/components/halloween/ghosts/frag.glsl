uniform vec3 uColor;
uniform float uOpacity;

varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vViewDir;

// Inside an ellipse centred at c with radii r, on the ghost's front (+Z).
float feature(vec2 c, vec2 r) {
  float d = length((vLocal.xy - c) / r);
  return (1.0 - smoothstep(0.8, 1.0, d)) * step(0.0, vLocal.z);
}

void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  float fresnel = pow(1.0 - abs(dot(n, vViewDir)), 2.0);

  // Glowy edges, nearly see-through middle — and fading out toward the hem.
  float alpha = (0.28 + fresnel * 0.6) * smoothstep(-0.05, 0.35, vLocal.y);
  vec3 color = uColor * (1.1 + fresnel * 0.8);

  float face = max(
    max(
      feature(vec2(0.11, 0.74), vec2(0.055, 0.08)),
      feature(vec2(-0.11, 0.74), vec2(0.055, 0.08))
    ),
    feature(vec2(0.0, 0.56), vec2(0.06, 0.075))
  );
  color = mix(color, vec3(0.02, 0.01, 0.03), face);
  alpha = mix(alpha, 0.92, face);

  gl_FragColor = vec4(color, alpha * uOpacity);
}
