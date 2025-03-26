precision highp float;

const int SAMPLE_COUNT = 24;
const vec3 LUMINANCE_FACTORS = vec3(0.2126, 0.7152, 0.0722);

uniform sampler2D uMainTexture;
uniform sampler2D uDepthTexture;
uniform vec2 resolution;
uniform float uPixelRatio;
uniform float uTolerance;

uniform float uOpacity;

// Basics
uniform float uGamma;
uniform float uContrast;
uniform float uExposure;
uniform float uBrightness;

// Vignette
uniform float uVignetteRadius;
uniform float uVignetteSpread;
uniform float uVignetteStrength;
uniform float uVignetteSoftness;

// Bloom
uniform float uBloomStrength;
uniform float uBloomRadius;
uniform float uBloomThreshold;
uniform float uActiveBloom;

// Color mask (basketball)
uniform vec2 uEllipseCenter;
uniform vec2 uEllipseSize;
uniform float uEllipseSoftness;
uniform bool uDebugEllipse;

// 404
uniform float u404Transition;

uniform float uTime;

const float GOLDEN_ANGLE = 2.399963229728653;
const float DENSITY = 0.9;
const float OPACITY_SCANLINE = 0.24;
const float OPACITY_NOISE = 0.01;

// Additional precalculated constants
const float PI_2 = 6.28318530718; // 2*PI

varying vec2 vUv;

float getVignetteFactor(vec2 uv) {
  vec2 center = vec2(0.5, 0.5);
  float radius = uVignetteRadius;
  float spread = uVignetteSpread;

  float vignetteFactor =
    1.0 - smoothstep(radius, radius - spread, length(uv - center));
  return vignetteFactor;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 456.21);
  return fract(p.x * p.y);
}

vec2 vogelDiskSample(int sampleIndex, int samplesCount, float phi) {
  float invSamplesCount = 1.0 / sqrt(float(samplesCount));

  float r = sqrt(float(sampleIndex) + 0.5) * invSamplesCount;
  float theta = float(sampleIndex) * GOLDEN_ANGLE + phi;

  return vec2(r * cos(theta), r * sin(theta));
}

vec3 invertedGamma(vec3 color, float gamma) {
  return pow(color, vec3(gamma));
}

vec3 exposureToneMap(vec3 color, float exposure) {
  return vec3(1.0) - exp(-color * exposure);
}

vec3 contrast(vec3 color, float contrast) {
  return (color - 0.5) * contrast + 0.5;
}

// Optimize the RRTAndODTFit function to reduce operations
vec3 RRTAndODTFit(vec3 v) {
  // Precalculated constants
  const float c1 = 0.0245786;
  const float c2 = -0.000090537;
  const float c3 = 0.983729;
  const float c4 = 0.432951;
  const float c5 = 0.238081;

  // Operations organized to minimize calculations
  vec3 v2 = v * v;
  vec3 a = v * c1 + v2 + c2;
  vec3 b = v * c4 + v2 * c3 + c5;

  return a / b;
}

vec3 ACESFilmicToneMapping(vec3 color) {
  // Precalculated constants for exposure
  const float EXPOSURE_ADJUST = 1.0 / 0.6;

  // Transposed matrices to optimize multiplications
  // sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
  const mat3 ACESInputMat = mat3(
    0.59719, 0.35458, 0.04823,
    0.076  , 0.90834, 0.01566,
    0.0284 , 0.13383, 0.83777
  );

  // ODT_SAT => XYZ => D60_2_D65 => sRGB
  const mat3 ACESOutputMat = mat3(
     1.60475, -0.53108, -0.07367,
    -0.10208,  1.10813, -0.00605,
    -0.00327, -0.07276,  1.07602
  );

  // Apply adjusted exposure
  color *= uExposure * EXPOSURE_ADJUST;

  // Optimized matrix multiplication (skip multiplications by 0)
  vec3 colorTransformed;

  // First transformation: ACESInputMat * color
  colorTransformed.r =
    ACESInputMat[0][0] * color.r +
    ACESInputMat[0][1] * color.g +
    ACESInputMat[0][2] * color.b;
  colorTransformed.g =
    ACESInputMat[1][0] * color.r +
    ACESInputMat[1][1] * color.g +
    ACESInputMat[1][2] * color.b;
  colorTransformed.b =
    ACESInputMat[2][0] * color.r +
    ACESInputMat[2][1] * color.g +
    ACESInputMat[2][2] * color.b;

  // Apply RRT and ODT
  colorTransformed = RRTAndODTFit(colorTransformed);

  // Second transformation: ACESOutputMat * colorTransformed
  vec3 outputColor;
  outputColor.r =
    ACESOutputMat[0][0] * colorTransformed.r +
    ACESOutputMat[0][1] * colorTransformed.g +
    ACESOutputMat[0][2] * colorTransformed.b;
  outputColor.g =
    ACESOutputMat[1][0] * colorTransformed.r +
    ACESOutputMat[1][1] * colorTransformed.g +
    ACESOutputMat[1][2] * colorTransformed.b;
  outputColor.b =
    ACESOutputMat[2][0] * colorTransformed.r +
    ACESOutputMat[2][1] * colorTransformed.g +
    ACESOutputMat[2][2] * colorTransformed.b;

  // Clamp to [0, 1]
  return clamp(outputColor, 0.0, 1.0);
}

vec3 tonemap(vec3 color) {
  // Apply brightness - here we continue using direct multiplication
  color.rgb *= uBrightness;

  // Apply contrast
  color = contrast(color, uContrast);

  // Apply inverted gamma correction
  color = invertedGamma(color, uGamma);

  // Apply optimized ACES Filmic Tone Mapping
  color = ACESFilmicToneMapping(color);

  return color;
}

float random(vec2 st) {
  // Precalculated constants
  const vec2 k = vec2(12.9898, 78.233);
  const float m = 43758.5453123;

  // Optimized calculation
  float dot_product = dot(st.xy, k);
  return fract(sin(dot_product) * m);
}

float blend(const float x, const float y) {
  // Use mix with step to reduce branching
  return mix(2.0 * x * y, 1.0 - 2.0 * (1.0 - x) * (1.0 - y), step(0.5, x));
}

vec3 blend(const vec3 x, const vec3 y, const float opacity) {
  // Using the optimized blend version
  vec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));

  // Optimization: direct use of lerp/mix instead of manual operations
  return mix(x, z, opacity);
}

void main() {
  // Precalculate frequently used values
  float checkerSize = 2.0 * uPixelRatio;
  vec2 checkerPos = floor(gl_FragCoord.xy / checkerSize);
  float checkerPattern = mod(checkerPos.x + checkerPos.y, 2.0);

  // Precalculate resolution divisions
  vec2 halfResolution = resolution / 2.0;
  vec2 eighthResolution = resolution / 8.0;
  vec2 invResolution = 1.0 / resolution;
  vec2 uvOffset = invResolution;

  // Calculate pixelated coordinates only once
  vec2 pixelatedUv = floor(vUv * halfResolution) * 2.0 / resolution;
  vec2 pixelatedUvEighth = floor(vUv * eighthResolution) * 8.0 / resolution;

  // Optimized texture reading
  vec4 baseColorSample = texture2D(uMainTexture, vUv);
  vec3 color = baseColorSample.rgb;

  // Apply tonemap only once for the main color
  color = tonemap(color);

  // Calculate alpha and check if we need the pixelated texture
  float alpha = 1.0;

  // Optimize opacity check
  if (uOpacity < 0.001) {
    // If opacity is almost zero, directly set alpha to 0
    alpha = 0.0;
  } else {
    float reveal = 1.0 - uOpacity;
    reveal = clamp(reveal, 0.0, 1.0);
    reveal = reveal * reveal * reveal * reveal;

    // Only calculate baseBrightness if necessary
    if (reveal > 0.0) {
      vec4 basePixelatedSample = texture2D(uMainTexture, pixelatedUvEighth);
      float baseBrightness = dot(
        tonemap(basePixelatedSample.rgb),
        LUMINANCE_FACTORS
      );

      if (baseBrightness < reveal) {
        alpha = 0.0;
      }
    }
  }

  // The bloom calculation remains exactly the same
  vec3 bloomColor = vec3(0.0);

  if (uBloomStrength > 0.001 && checkerPattern > 0.5 && uActiveBloom > 0.5) {
    // Apply bloom effect only when bloom strength is significant and on checker pattern
    vec3 bloom = vec3(0.0);
    float totalWeight = 0.0;
    float phi = hash(pixelatedUv) * PI_2; // Random rotation angle, using precalculated constant

    // Precalculate the division of uBloomRadius by resolution
    vec2 bloomRadiusScaled = uBloomRadius * invResolution;

    for (int i = 1; i < SAMPLE_COUNT; i++) {
      vec2 sampleOffset =
        vogelDiskSample(i, SAMPLE_COUNT, phi) * bloomRadiusScaled;
      float dist = length(sampleOffset);

      // Gaussian-like falloff - avoid division when dist is very small
      float weight = dist > 0.001 ? 1.0 / dist : 1000.0;

      // Sample color at offset position - use precalculated coordinates
      vec3 sampleColor = texture2D(
        uMainTexture,
        pixelatedUv + sampleOffset + uvOffset
      ).rgb;

      // Only add to bloom if brightness is above threshold
      float brightness = dot(sampleColor, LUMINANCE_FACTORS);

      // Avoid conditional branching which can be costly on GPUs
      // Use a version of step() to simulate the if-statement
      float shouldAdd = step(uBloomThreshold, brightness);
      totalWeight += weight;
      bloom += sampleColor * weight * shouldAdd;
    }

    // Normalize bloom and apply strength
    float safeWeight = max(totalWeight, 0.0001);
    bloomColor = bloom / safeWeight * uBloomStrength;
  }

  // Add bloom to result with strength control
  color += bloomColor;
  color = clamp(color, 0.0, 1.0);

  // The vignette application remains exactly the same
  float vignetteFactor = getVignetteFactor(vUv);
  color = mix(color, vec3(0.0), vignetteFactor);

  gl_FragColor = vec4(color, alpha);

  #include <colorspace_fragment>
}
