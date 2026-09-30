uniform float uSeed;
uniform float uOpacity;

varying vec2 vUv;

const float QUARTER = 1.5707963;
const int SPOKES = 5;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 43.0) * 43758.5453);
}

void main() {
  // The corner is the origin; the web is a quarter disc fanning out from it.
  float r = length(vUv);
  if (r > 1.0) discard;
  float a = atan(vUv.y, vUv.x) / QUARTER; // 0..1 across the quarter

  // Radial threads.
  float cell = a * float(SPOKES - 1);
  float spokeDist = abs(fract(cell + 0.5) - 0.5) / float(SPOKES - 1);
  float spoke = 1.0 - smoothstep(0.0, 0.006 / max(r, 0.1), spokeDist);

  // Rings, sagging toward the corner between two spokes.
  float sag = sin(fract(cell) * 3.14159) * 0.05 * r;
  float ringPos = (r + sag) * 8.0;
  float ring = 1.0 - smoothstep(0.0, 0.05, abs(fract(ringPos) - 0.5) - 0.44);
  // Old webs are torn: break the rings up and eat the rim.
  float torn = step(0.28, hash(vec2(floor(ringPos), floor(cell))));
  float rim =
    1.0 - smoothstep(0.7, 1.0, r + (hash(floor(vUv * 18.0)) - 0.5) * 0.2);

  float strand = max(spoke, ring * torn * step(0.1, r)) * rim;
  if (strand < 0.02) discard;
  gl_FragColor = vec4(vec3(0.82, 0.8, 0.88), strand * 0.55 * uOpacity);
}
