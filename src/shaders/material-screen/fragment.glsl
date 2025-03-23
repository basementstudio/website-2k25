precision mediump float; // Declare medium precision by default

uniform sampler2D map;
uniform float uTime;
uniform float uRevealProgress;
uniform float uFlip;
uniform float uIsGameRunning;
varying vec2 vUv;
varying vec3 vPosition;

#define TINT_R (1.33)
#define TINT_G (0.11)
#define BRIGHTNESS (15.0)
#define VIGNETTE_STRENGTH (0.1)
#define DISTORTION (0.3)
#define NOISE_INTENSITY (0.3)
#define TIME_SPEED (1.0)
#define LINE_HEIGHT (0.1)
#define MASK_INTENSITY (0.3)
#define MASK_SIZE (8.0)
#define MASK_BORDER (0.4)
#define INTERFERENCE1 (0.4)
#define INTERFERENCE2 (0.001)
#define SCANLINE_INTENSITY (0.2)
#define SCANLINE_COUNT (200.0)
#define NOISE_SCALE (500.0)
#define NOISE_OPACITY (0.01)

#define SCAN_SPEED (5.0)
#define SCAN_CYCLE (10.0)
#define SCAN_DISTORTION (0.003)

vec2 curveRemapUV(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) / vec2(5.0, 5.0);
  uv = uv + uv * offset * offset * DISTORTION;
  uv = uv * 0.5 + 0.5;
  return uv;
}

// Random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float peak(float x, float xpos, float scale) {
  float d = abs(x - xpos);
  // Approximation of log(1/d) for small values
  float approxLog = d > 0.001 ? -4.605 * d + 2.0 : 6.0;
  return clamp((1.0 - x) * scale * approxLog, 0.0, 1.0);
}

void main() {
  // Add cycle to scan line
  float scanCycleTime = mod(uTime * SCAN_SPEED, SCAN_CYCLE + 50.0);
  float scanPos;
  if (scanCycleTime < SCAN_CYCLE) {
    scanPos = scanCycleTime / SCAN_CYCLE;
  } else {
    scanPos = 1.0;
  }

  // Add interference
  float scany = round(vUv.y * 1024.0);

  float r = random(vec2(0.0, scany) + vec2(uTime * 0.001));
  if (r > 0.995) {
    r *= 3.0;
  }
  float ifx1 = INTERFERENCE1 * 2.0 / 1024.0 * r;
  float ifx2 = INTERFERENCE2 * (r * peak(vUv.y, 0.2, 0.2));

  vec2 interferenceUv = vUv;
  interferenceUv.x += ifx1 - ifx2;

  vec2 remappedUv = curveRemapUV(interferenceUv);

  if (uFlip == 1.0) {
    remappedUv.y = 1.0 - remappedUv.y;

    // Add pixelation that excludes a center square
    float pixelSize = 300.0;
    vec2 centeredUv = remappedUv - 0.5;

    // Square parameters directly in the main function
    float squareWidth = 0.25;
    float squareHeight = 0.05;
    float squareX = -0.01;
    float squareY = -0.4;

    vec2 squareCenter = vec2(squareX, squareY);
    vec2 relativeToSquare = centeredUv - squareCenter;
    vec2 absRelToSquare = abs(relativeToSquare);
    bool insideSquare =
      absRelToSquare.x < squareWidth && absRelToSquare.y < squareHeight;

    // Score square parameters
    float centerSquareWidth = 0.2;
    float centerSquareHeight = 0.2;
    float centerSquareX = -0.35;
    float centerSquareY = 0.5;

    vec2 centerSquareCenter = vec2(centerSquareX, centerSquareY);
    vec2 relativeToCenterSquare = centeredUv - centerSquareCenter;

    bool insideCenterSquare =
      abs(relativeToCenterSquare.x) < centerSquareWidth &&
      abs(relativeToCenterSquare.y) < centerSquareHeight;

    vec3 textureColor = vec3(0.0);

    // Calculate texture boundaries once at the beginning
    bool validUV =
      remappedUv.x >= 0.0 &&
      remappedUv.x <= 1.0 &&
      remappedUv.y >= 0.0 &&
      remappedUv.y <= 1.0;

    // Use this variable where needed
    if (validUV) {
      textureColor = texture2D(map, remappedUv).rgb;
    }

    // Simplification of conditional logic
    bool shouldApplyPixelation =
      uIsGameRunning > 0.5 && !insideCenterSquare ||
      uIsGameRunning <= 0.5 && !insideSquare && !insideCenterSquare;

    if (shouldApplyPixelation) {
      remappedUv = floor(remappedUv * pixelSize) / pixelSize;

      if (
        remappedUv.x >= 0.0 &&
        remappedUv.x <= 1.0 &&
        remappedUv.y >= 0.0 &&
        remappedUv.y <= 1.0
      ) {
        textureColor = texture2D(map, remappedUv).rgb;
      }
    }

    // Only show the square when game is NOT running
    if (insideSquare && uIsGameRunning <= 0.5) {
      // Apply some visual effect to the square to make it visible
      vec3 squareColor = vec3(1.0, 1.0, 0.0); // Yellow color
      textureColor = mix(textureColor, squareColor, 0.3);
    }
  }

  // Add horizontal distortion near scan line
  float y = (vUv.y - scanPos) * 160.0;
  float expApprox = 1.0 / (1.0 + y * y * 0.5 + y * y * y * y * 0.125);
  float scanDistortion = expApprox * SCAN_DISTORTION;
  remappedUv.x += scanDistortion;

  vec3 textureColor = vec3(0.0);

  // Calculate texture boundaries once at the beginning
  bool validUV =
    remappedUv.x >= 0.0 &&
    remappedUv.x <= 1.0 &&
    remappedUv.y >= 0.0 &&
    remappedUv.y <= 1.0;

  // Use this variable where needed
  if (validUV) {
    textureColor = texture2D(map, remappedUv).rgb;
  }

  float luma = dot(textureColor, vec3(0.8, 0.1, 0.1));
  vec3 tint = vec3(1.0, 0.302, 0.0);
  tint.r *= TINT_R;
  tint.g *= TINT_G;
  textureColor = luma * tint * BRIGHTNESS;

  float currentLine = floor(vUv.y / LINE_HEIGHT);
  float revealLine = floor(uRevealProgress / LINE_HEIGHT);
  float textureVisibility = currentLine <= revealLine ? 0.8 : 0.0;

  // Start with black background and blend with revealed texture
  vec3 color = mix(vec3(0.0), textureColor, textureVisibility);

  // Add vignette
  vec2 vignetteUv = vUv * 2.0 - 1.0;
  float vignette =
    1.0 - min(1.0, dot(vignetteUv, vignetteUv) * VIGNETTE_STRENGTH);
  color *= vignette;

  // Add noise overlay
  vec2 noiseUv = gl_FragCoord.xy / NOISE_SCALE;
  float noise = random(noiseUv + uTime);
  color = mix(color, color + vec3(noise), NOISE_OPACITY);

  // Add orange tint to black areas
  vec3 orangeTint = vec3(0.2, 0.05, 0.0);
  float blackThreshold = 0.01;
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(color + orangeTint * 0.1, color, step(blackThreshold, luminance));

  // Add scanlines
  float scanline = step(0.5, fract(vPosition.y * SCANLINE_COUNT));
  scanline = mix(1.0, 0.7, scanline * SCANLINE_INTENSITY);
  color = mix(
    color,
    color * scanline + vec3(0.1, 0.025, 0.0) * (1.0 - scanline),
    0.5
  );

  gl_FragColor = vec4(color, 1.0);
}
