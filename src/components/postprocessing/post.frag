precision highp float;

const int SAMPLE_COUNT = 24;

uniform sampler2D uMainTexture;
uniform vec2 resolution;
uniform float uPixelRatio;
uniform float uTolerance;

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

varying vec2 vUv;

float getVignetteFactor(vec2 uv) {
  vec2 center = vec2(0.5, 0.5);
  float radius = uVignetteRadius;
  float spread = uVignetteSpread;

  float vignetteFactor = 1.0 - smoothstep(radius, radius - spread, length(uv - center));
  return vignetteFactor;
}

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

vec3 invertedGamma(vec3 color, float gamma) {
  return pow(color, vec3(gamma));
}

vec3 exposureToneMap(vec3 color, float exposure) {
  return vec3(1.0) - exp(-color * exposure);
}

vec3 contrast(vec3 color, float contrast) {
  return (color - 0.5) * contrast + 0.5;
}

// source: https://github.com/selfshadow/ltc_code/blob/master/webgl/shaders/ltc/ltc_blit.fs
vec3 RRTAndODTFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.432951) + 0.238081;
  return a / b;
}

vec3 ACESFilmicToneMapping(vec3 color) {
  // sRGB => XYZ => D65_2_D60 => AP1 => RRT_SAT
  const mat3 ACESInputMat = mat3(vec3(0.59719, 0.076, 0.0284), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));

  // ODT_SAT => XYZ => D60_2_D65 => sRGB
  const mat3 ACESOutputMat = mat3(vec3(1.60475, -0.10208, -0.00327), // transposed from source
  vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));

  color *= uExposure / 0.6;

  color = ACESInputMat * color;

  // Apply RRT and ODT
  color = RRTAndODTFit(color);

  color = ACESOutputMat * color;

  // Clamp to [0, 1]
  return clamp(color, 0.0, 1.0);
}

vec3 tonemap(vec3 color) {
  color.rgb *= uBrightness;
  color = contrast(color, uContrast);
  color = invertedGamma(color, uGamma);
  color = ACESFilmicToneMapping(color);

  return color;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float blend(const float x, const float y) {
  return x < 0.5 ? 2.0 * x * y : 1.0 - 2.0 * (1.0 - x) * (1.0 - y);
}

vec3 blend(const vec3 x, const vec3 y, const float opacity) {
  vec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));
  return z * opacity + x * (1.0 - opacity);
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

  // Vignette
  float vignetteFactor = getVignetteFactor(vUv);
  color = mix(color, vec3(0.0), vignetteFactor);

  gl_FragColor = vec4(color, 1.0);

  #include <colorspace_fragment>
}
