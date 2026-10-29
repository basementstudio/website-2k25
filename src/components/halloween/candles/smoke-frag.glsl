uniform float fadeFactor;
varying vec2 vUv;
varying float vAge;

void main() {
  float width = mix(0.035, 0.35, vUv.y);
  float plume = exp(-pow((vUv.x - 0.5) / width, 2.0) * 2.0);
  plume *= smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.5, 1.0, vUv.y));
  float life =
    smoothstep(0.0, 0.08, vAge) * (1.0 - smoothstep(0.35, 1.0, vAge));
  gl_FragColor = vec4(
    0.36,
    0.32,
    0.39,
    plume * life * 0.26 * (1.0 - fadeFactor)
  );
}
