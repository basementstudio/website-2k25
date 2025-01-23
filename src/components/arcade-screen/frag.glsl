precision highp float;

uniform sampler2D map;
varying vec2 vUv;

#define TINT_R (1.33)
#define TINT_G (0.33)

#define BRIGHTNESS (8.0)
#define LUMA_INTENSITY (1.7)

// Grid parameters

#define GRID_INTERVAL (0.004)
#define GRID_THICKNESS (0.0001)
#define GRID_COLOR (vec4(0.0, 0.0, 0.0, 1.0))
#define AA_WIDTH (0.002)

#define GRAY_TINT (vec4(0.1, 0.1, 0.1, 0.17))

void main() {
  vec3 color = texture2D(map, vUv).rgb;

  // Calculate monochrome with tint first
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  luma = pow(luma, 1.0 / LUMA_INTENSITY);

  vec3 tint = vec3(1.0, 0.302, 0.0); // base color #FF4D00
  tint.r *= TINT_R;
  tint.g *= TINT_G;

  color.rgb = luma * tint * BRIGHTNESS;

  // Add gray tint layer
  color.rgb = mix(color.rgb, GRAY_TINT.rgb, GRAY_TINT.a);

  // Add anti-aliased grid overlay
  float offset = GRID_THICKNESS / 2.0 - (1.0 - GRID_INTERVAL) / 2.0;

  vec2 gridUv = fract((vUv + offset) / GRID_INTERVAL) * GRID_INTERVAL;
  vec2 gridDist = abs(gridUv - GRID_INTERVAL / 2.0);

  float lineWidth = GRID_THICKNESS / 2.0;
  float horizontalLine = smoothstep(
    lineWidth + AA_WIDTH,
    lineWidth - AA_WIDTH,
    gridDist.x
  );
  float verticalLine = smoothstep(
    lineWidth + AA_WIDTH,
    lineWidth - AA_WIDTH,
    gridDist.y
  );

  float grid = max(horizontalLine, verticalLine);

  color.rgb = mix(color.rgb, GRID_COLOR.rgb, grid * GRID_COLOR.a);

  gl_FragColor = vec4(color, 1.0);
}
