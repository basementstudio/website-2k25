precision highp float;

uniform sampler2D uMainTexture;
uniform vec2 resolution;

uniform float uTolerance;
uniform float uBrightness;

uniform float uBias;
uniform float uColorNum;
uniform float uColorMultiplier;
uniform float uPixelSize;

uniform float uBloomStrength;
uniform float uBloomRadius;

// post
uniform float uGamma;
uniform float uContrast;
uniform float uExposure;

varying vec2 vUv;

const float bayerMatrix8x8[64] = float[64](
  0.0 / 64.0,
  48.0 / 64.0,
  12.0 / 64.0,
  60.0 / 64.0,
  3.0 / 64.0,
  51.0 / 64.0,
  15.0 / 64.0,
  63.0 / 64.0,
  32.0 / 64.0,
  16.0 / 64.0,
  44.0 / 64.0,
  28.0 / 64.0,
  35.0 / 64.0,
  19.0 / 64.0,
  47.0 / 64.0,
  31.0 / 64.0,
  8.0 / 64.0,
  56.0 / 64.0,
  4.0 / 64.0,
  52.0 / 64.0,
  11.0 / 64.0,
  59.0 / 64.0,
  7.0 / 64.0,
  55.0 / 64.0,
  40.0 / 64.0,
  24.0 / 64.0,
  36.0 / 64.0,
  20.0 / 64.0,
  43.0 / 64.0,
  27.0 / 64.0,
  39.0 / 64.0,
  23.0 / 64.0,
  2.0 / 64.0,
  50.0 / 64.0,
  14.0 / 64.0,
  62.0 / 64.0,
  1.0 / 64.0,
  49.0 / 64.0,
  13.0 / 64.0,
  61.0 / 64.0,
  34.0 / 64.0,
  18.0 / 64.0,
  46.0 / 64.0,
  30.0 / 64.0,
  33.0 / 64.0,
  17.0 / 64.0,
  45.0 / 64.0,
  29.0 / 64.0,
  10.0 / 64.0,
  58.0 / 64.0,
  6.0 / 64.0,
  54.0 / 64.0,
  9.0 / 64.0,
  57.0 / 64.0,
  5.0 / 64.0,
  53.0 / 64.0,
  42.0 / 64.0,
  26.0 / 64.0,
  38.0 / 64.0,
  22.0 / 64.0,
  41.0 / 64.0,
  25.0 / 64.0,
  37.0 / 64.0,
  21.0 / 64.0
);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 456.21);
  return fract(p.x * p.y);
}

vec3 dither(vec2 uv, vec3 color) {
  vec3 originalColor = color.rgb;

  // Screen coordinates for noise
  vec2 screenCoord = uv * resolution;

  // Generate noise using hash function
  vec3 noise = vec3(hash(screenCoord)) * 0.1;

  int x = int(uv.x * resolution.x / uPixelSize) % 8;
  int y = int(uv.y * resolution.y / uPixelSize) % 8;
  float threshold = bayerMatrix8x8[y * 8 + x] - uBias;

  // Add noise to the threshold
  threshold += noise.r - 0.05;

  color.rgb += threshold * uColorMultiplier;
  color.r = floor(color.r * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
  color.g = floor(color.g * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
  color.b = floor(color.b * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);

  float luma = dot(originalColor, vec3(0.299, 0.587, 0.114));
  // Reduce dithering effect in very bright or dark areas
  float ditherStrength =
    1.0 - smoothstep(0.3, 0.5, luma + 0.1) + smoothstep(0.5, 0.7, luma - 0.1);
  color = mix(originalColor, color, ditherStrength);

  return color;
}

vec3 gamma(vec3 color) {
  return pow(color, vec3(1.0 / 2.2)); // 2.2 is standard gamma correction value
}

vec3 gamma(vec3 color, float gamma) {
  return pow(color, vec3(1.0 / gamma));
}

vec3 invertedGamma(vec3 color, float gamma) {
  return pow(color, vec3(gamma));
}

// // ACES filmic tone mapping approximation
vec3 acesFilm(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp(x * (a * x + b) / (x * (c * x + d) + e), 0.0, 1.0);
}

// AGX color grading
vec3 agxDefaultContrastApprox(vec3 x) {
  vec3 x2 = x * x;
  vec3 x4 = x2 * x2;
  return +15.5 * x4 * x2 -
  40.14 * x4 * x +
  31.96 * x4 -
  6.868 * x2 * x +
  0.4298 * x2 +
  0.1191 * x -
  0.00232;
}

vec3 agxLook(vec3 color) {
  const vec3 lw = vec3(0.2126, 0.7152, 0.0722);
  float luma = dot(color, lw);
  vec3 offset = vec3(0.0);
  vec3 slope = vec3(1.0);
  vec3 power = vec3(1.0);

  // Apply slope-offset-power adjustments
  color = pow(max(vec3(0.0), color * slope + offset), power);
  return color;
}

vec3 agx(vec3 color) {
  // Apply default AGX contrast curve
  color = agxDefaultContrastApprox(color);

  // Apply look adjustments
  color = agxLook(color);

  return max(vec3(0.0), color);
}

// // Exposure tone mapping
vec3 exposureToneMap(vec3 color, float exposure) {
  return vec3(1.0) - exp(-color * exposure);
}

vec3 contrast(vec3 color, float contrast) {
  return color * contrast;
}

vec3 tonemap(vec3 color) {
  color = exposureToneMap(color, uExposure);
  color = contrast(color, uContrast);
  color = invertedGamma(color, uGamma);
  // color = gamma(color, uGamma);
  color = acesFilm(color);
  return color;
}

void main() {
  vec2 uv = vUv;
  vec2 normalizedPixelSize = uPixelSize / resolution;
  uv = normalizedPixelSize * floor(vUv / normalizedPixelSize);

  vec4 baseColorSample = texture2D(uMainTexture, uv);
  vec3 color = baseColorSample.rgb;

  color.rgb *= uBrightness;

  color = tonemap(color);

  color.rgb = dither(uv, color);

  // Apply bloom effect
  float bloomIntensity = 0.8;
  vec3 bloom = vec3(0.0);
  float totalWeight = 0.0;

  // Sample neighboring pixels in a circular pattern
  for (float x = -uBloomRadius; x <= uBloomRadius; x += 1.0) {
    for (float y = -uBloomRadius; y <= uBloomRadius; y += 1.0) {
      vec2 offset = vec2(x, y) / resolution;
      float dist = length(offset);

      // Gaussian-like falloff
      float weight = exp(-dist * dist / (2.0 * uBloomRadius));

      // Sample color at offset position
      vec3 sampleColor = texture2D(uMainTexture, uv + offset).rgb;

      // Only add to bloom if brightness is above threshold
      float brightness = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
      totalWeight += weight;
      if (brightness > 0.5) {
        // Add weighted sample to bloom
        bloom += sampleColor * weight;
      } else {
        bloom += vec3(0.0);
      }
    }
  }

  // Normalize bloom
  bloom /= totalWeight;

  // Add bloom to result with strength control
  color += bloom * uBloomStrength * bloomIntensity;

  // Clamp result to valid range
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);

  #include <colorspace_fragment>
}
