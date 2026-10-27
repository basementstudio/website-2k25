uniform vec3 uColor;
uniform float uOpacity;
uniform float uLightFlicker;
uniform float uLightning;

varying float vAlpha;

void main() {
  // Soft round puff.
  float d = length(gl_PointCoord - 0.5);
  float puff = pow(smoothstep(0.5, 0.0, d), 2.0);

  // Same rules as the ghost: brighter in a blackout, washed out by a strike.
  vec3 color = uColor * (1.0 + (1.0 - uLightFlicker) * 0.8);
  float alpha = puff * vAlpha * 0.6 * uOpacity;
  alpha *= 1.0 - clamp(uLightning, 0.0, 1.0) * 0.6;

  gl_FragColor = vec4(color, alpha);
}
