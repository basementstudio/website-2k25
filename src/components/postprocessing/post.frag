precision highp float;

// imports
#pragma glslify: PI = require(glsl-constants/PI)

// constants
const vec2 curvature = vec2(8.0, 8.0);
const float COLOR_NUM = 4.0;
const bool IS_MONOCHROME = false;
const vec3 MONOCHROME_COLOR = vec3(1.0, 0.52, 0.0);
const float PIXEL_SIZE = 1.5;

// uniforms
uniform sampler2D uGameTexture;
uniform sampler2D uUiTexture;
uniform vec2 screenSize;
uniform float dpr;
uniform float aspect;
uniform bool uDisablePostprocessing;

// varying
varying vec2 vUv;

const mat4 bayerMatrix4x4 =
  mat4(
     0.0, 12.0,  3.0, 15.0,
    14.0,  2.0, 13.0,  1.0,
     4.0,  8.0,  7.0, 11.0,
     9.0,  5.0, 10.0,  6.0
  ) /
  16.0;

vec3 dither(vec2 uv, vec3 color) {
  // boosted brightness a bit
  color.rgb *= 2.0;

  int x = int(mod(uv.x * screenSize.x, 4.0));
  int y = int(mod(uv.y * screenSize.y, 4.0));
  float threshold = bayerMatrix4x4[y][x] - 0.88;

  // softened dithering effect plus a brighter bias
  color.rgb += (threshold - 0.4) * 0.15;

    float levelValue = COLOR_NUM * 1.5 - 1.0;
    vec3 levels = vec3(levelValue);
    color.rgb = floor(color.rgb * levels + 0.5) / levels;

    // Boost post-quantization brightness slightly
    color.rgb = pow(color.rgb, vec3(0.9));

  return clamp(color, 0.0, 1.0);
}

// Utils

// Get deges with respect of the screen size
vec2 getEdgeSdf(vec2 uv) {
  vec2 pixelCoord = uv * screenSize * dpr;
  vec2 d = min(pixelCoord, screenSize * dpr - pixelCoord);
  return d / (screenSize * dpr);
}

vec2 curveRemapUV(vec2 uv) {
  // as we near the edge of our screen apply greater distortion using a cubic function
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) / vec2(curvature.x, curvature.y);
  uv = uv + uv * offset * offset;
  uv = uv * 0.5 + 0.5;
  return uv;
}

float scanLineIntensity(float uv, float resolution, float opacity) {
  float intensity = sin(uv * resolution * PI * 2.0);
  intensity = (0.5 * intensity + 0.5) * 0.9 + 0.1;
  return pow(intensity, opacity);
}

vec2 clamp2(vec2 uv, float min, float max) {
  return vec2(clamp(uv.x, min, max), clamp(uv.y, min, max));
}

vec2 getVignette(
  vec2 uv,
  vec2 screenResolution,
  float roundness,
  float vignetteOpacity
) {
  // Calculate base vignette
  vec2 vignetteValue = uv * (1.0 - uv) * screenResolution.x / roundness;

  // Apply power using pow() function component-wise
  return clamp2(
    vec2(
      pow(vignetteValue.x, vignetteOpacity),
      pow(vignetteValue.y, vignetteOpacity)
    ),
    0.0,
    1.0
  );
}

void main() {
  vec2 uv = vUv;
  vec2 uvPixel;

  if (!uDisablePostprocessing) {
    uv = curveRemapUV(vUv);
    vec2 normalizedPixelSize = PIXEL_SIZE / screenSize;
    uvPixel = normalizedPixelSize * floor(uv / normalizedPixelSize);
  } else {
    uvPixel = uv;
  }

  vec4 gameColor = texture2D(uGameTexture, uvPixel);
  vec4 uiColor = texture2D(uUiTexture, uvPixel);
  vec3 result = mix(gameColor.rgb, uiColor.rgb, uiColor.a);

  if (!uDisablePostprocessing) {
    result = dither(uvPixel, result);

    // Post
    vec2 vignette = getVignette(uv, screenSize, 10.0, 1.0);
    float vig = min(vignette.x, vignette.y);
    result = mix(vec3(0.0), result, vig);

    float scanLineX = scanLineIntensity(uv.y, screenSize.y / 4.0, 0.2);
    result *= scanLineX;
  }

  gl_FragColor = vec4(result, 1.0);
}
