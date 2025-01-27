precision highp float;

const int SAMPLE_COUNT = 24;

uniform sampler2D uMainTexture;
uniform vec2 resolution;
uniform float uPixelRatio;
uniform float uTolerance;
uniform float uBrightness;

uniform float uBias;
uniform float uColorMultiplier;
uniform float uNoiseFactor;

uniform float uBloomStrength;
uniform float uBloomRadius;
uniform float uBloomThreshold;

// post
uniform float uGamma;
uniform float uContrast;
uniform float uExposure;
uniform float uSaturation;

uniform vec2 uEllipseCenter;
uniform vec2 uEllipseSize;
uniform float uEllipseSoftness;
uniform bool uDebugEllipse;

uniform float uVignetteStrength;
uniform float uVignetteSoftness;

varying vec2 vUv;

const float GOLDEN_ANGLE = 2.399963229728653;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 456.21);
  return fract(p.x * p.y);
}

vec2 vogelDiskSample(int sampleIndex, int samplesCount, float phi) {
  float r = sqrt(float(sampleIndex) + 0.5) / sqrt(float(samplesCount));
  float theta = float(sampleIndex) * GOLDEN_ANGLE + phi;
  return vec2(r * cos(theta), r * sin(theta));
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

// Exposure tone mapping
vec3 exposureToneMap(vec3 color, float exposure) {
  return vec3(1.0) - exp(-color * exposure);
}

// // ACES filmic tone mapping approximation
vec3 acesFilm(vec3 x) {
  x = exposureToneMap(x, uExposure);
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

vec3 contrast(vec3 color, float contrast) {
  return color * contrast;
}

#define saturate(a) clamp(a, 0.0, 1.0)

// source: https://github.com/selfshadow/ltc_code/blob/master/webgl/shaders/ltc/ltc_blit.fs
vec3 RRTAndODTFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.432951) + 0.238081;
  return a / b;

}

// this implementation of ACES is modified to accommodate a brighter viewing environment.
// the scale factor of 1/0.6 is subjective. see discussion in #19621.

vec3 ACESFilmicToneMapping(vec3 color) {
  // sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
  const mat3 ACESInputMat = mat3(vec3(0.59719, 0.076, 0.0284), // transposed from source
  vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));

  // ODT_SAT => XYZ => D60_2_D65 => sRGB
  const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), // transposed from source
  vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));

  color *= uExposure / 0.6;

  color = ACESInputMat * color;

  // Apply RRT and ODT
  color = RRTAndODTFit(color);

  color = ACESOutputMat * color;

  // Clamp to [0, 1]
  return saturate(color);

}

vec3 adjustSaturation(vec3 color, float saturation) {
  float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
  vec2 normalizedPos = (vUv - uEllipseCenter) / uEllipseSize;

  float ellipseDistance = length(normalizedPos);
  float ellipseMask = smoothstep(1.0 + uEllipseSoftness, 0.3, ellipseDistance);

  float vignetteDistance = length((vUv - vec2(0.5)) * 2.0);
  float vignetteMask = smoothstep(0.0, 1.0 + uVignetteSoftness, vignetteDistance);
  float finalVignette = vignetteMask * (1.0 - ellipseMask) * uVignetteStrength;

  float finalSaturation = mix(saturation, 1.0, ellipseMask);
  vec3 result = mix(vec3(gray), color, finalSaturation);

  result *= 1.0 - finalVignette;

  if(uDebugEllipse) {
    return mix(result, vec3(1.0, 0.0, 0.0), ellipseMask * 0.5);
  }

  return result;
}

vec3 tonemap(vec3 color) {
  color.rgb *= uBrightness;
  color = contrast(color, uContrast);
  color = adjustSaturation(color, uSaturation);
  color = invertedGamma(color, uGamma);
  color = ACESFilmicToneMapping(color);
  return color;
}

void main() {
  float checkerSize = 2.0 * uPixelRatio;
  vec2 checkerPos = floor(gl_FragCoord.xy / checkerSize);
  float checkerPattern = mod(checkerPos.x + checkerPos.y, 2.0);
  vec2 pixelatedUv = floor(vUv * resolution / 2.0) * 2.0 / resolution;

  vec4 baseColorSample = texture2D(uMainTexture, vUv);
  vec3 color = baseColorSample.rgb;

  color = tonemap(color);

  // Apply bloom effect with chess pattern
  vec3 bloom = vec3(0.0);
  float totalWeight = 0.0;
  float phi = hash(pixelatedUv) * 6.28; // Random rotation angle

  for(int i = 1; i < SAMPLE_COUNT; i++) {
    vec2 sampleOffset = vogelDiskSample(i, SAMPLE_COUNT, phi) * uBloomRadius / resolution;
    float dist = length(sampleOffset);

    // Gaussian-like falloff
    float weight = 1.0 / dist;

    // Sample color at offset position
    vec3 sampleColor = texture2D(uMainTexture, pixelatedUv + sampleOffset + vec2(1.0 / resolution.x, 1.0 / resolution.y)).rgb;

    // Only add to bloom if brightness is above threshold
    float brightness = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
    totalWeight += weight;
    if(brightness > uBloomThreshold)
      bloom += sampleColor * weight;
  }

  // Normalize bloom and apply chess pattern
  bloom /= totalWeight + 0.0001;
  vec3 bloomColor = bloom * uBloomStrength * checkerPattern;

  // Add bloom to result with strength control
  color += bloomColor;
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);

  #include <colorspace_fragment>
}
