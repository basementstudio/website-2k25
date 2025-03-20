uniform sampler2D uNoise;
uniform float uTime;

varying vec2 vUv;

// Define constants outside main to allow compiler optimizations
const float EDGE_LOWER = 0.0;
const float EDGE_INNER = 0.15;
const float EDGE_OUTER = 0.85;
const float EDGE_UPPER = 1.0;
const float STEAM_THRESHOLD = 0.45;
const vec3 BASE_COLOR = vec3(0.92, 0.78, 0.62);
const float STEAM_SPEED = 0.015;
const float UV_SCALE_X = 0.5;
const float UV_SCALE_Y = 0.3;
const float GRADIENT_SCALE = 1.25;
const float GRADIENT_OFFSET = 0.2;

void main() {
  // Combine UV calculations using multiply-add operations for better GPU utilization
  vec2 steamUv = vec2(
    vUv.x * UV_SCALE_X,
    vUv.y * UV_SCALE_Y - uTime * STEAM_SPEED
  );

  float steam = texture(uNoise, steamUv).r;
  steam = smoothstep(STEAM_THRESHOLD, EDGE_UPPER, steam);

  // Edge fade calculations - combined into fewer operations to reduce redundancy
  float edgeFadeX =
    smoothstep(EDGE_LOWER, EDGE_INNER, vUv.x) *
    (1.0 - smoothstep(EDGE_OUTER, EDGE_UPPER, vUv.x));
  float edgeFadeY =
    smoothstep(EDGE_LOWER, EDGE_INNER, vUv.y) *
    (1.0 - smoothstep(EDGE_OUTER, EDGE_UPPER, vUv.y));

  steam *= edgeFadeX * edgeFadeY;

  // Simplified checkerboard pattern calculation - reduces arithmetic operations
  float pattern = mod(
    floor(gl_FragCoord.x * 0.5) + floor(gl_FragCoord.y * 0.5),
    2.0
  );

  // Optimized gradient calculation using more efficient arithmetic order
  float gradient = clamp(
    GRADIENT_OFFSET - GRADIENT_SCALE * vUv.y + 1.0,
    0.0,
    1.0
  );

  float alpha = steam * pattern * gradient;

  // Early fragment discard optimization - skips blending operations for invisible pixels
  if (alpha < 0.001) {
    discard;
  }

  gl_FragColor = vec4(BASE_COLOR, alpha);
}
