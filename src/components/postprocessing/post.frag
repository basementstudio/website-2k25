precision highp float;

const int SAMPLE_COUNT = 32;

uniform sampler2D uMainTexture;
uniform vec2 resolution;

uniform float uTolerance;
uniform float uBrightness;

uniform float uBias;
uniform float uColorMultiplier;
uniform float uPixelSize;
uniform float uNoiseFactor;

uniform float uBloomStrength;
uniform float uBloomRadius;
uniform float uBloomThreshold;

// post
uniform float uGamma;
uniform float uContrast;
uniform float uExposure;

varying vec2 vUv;

const float GOLDEN_ANGLE = 2.399963229728653;

vec2 vogelDiskSample(int sampleIndex, int samplesCount, float phi) {
  float r = sqrt(float(sampleIndex) + 0.5) / sqrt(float(samplesCount));
  float theta = float(sampleIndex) * GOLDEN_ANGLE + phi;
  return vec2(r * cos(theta), r * sin(theta));
}

// Dummy Color Palette
const vec3 palette[16] = vec3[16](
  // Grays, browns, blues and orange palette
vec3(0.1, 0.1, 0.1), // Dark gray
vec3(0.3, 0.3, 0.3), // Medium gray
vec3(0.5, 0.5, 0.5), // Light gray
vec3(0.7, 0.7, 0.7), // Very light gray
vec3(0.4, 0.2, 0.1), // Dark brown
vec3(0.6, 0.3, 0.1), // Medium brown
vec3(0.8, 0.4, 0.2), // Light brown
vec3(0.95, 0.6, 0.3), // Tan
vec3(0.1, 0.2, 0.4), // Dark blue
vec3(0.2, 0.3, 0.6), // Navy blue
vec3(0.3, 0.4, 0.8), // Medium blue
vec3(0.4, 0.6, 0.9), // Light blue
vec3(1.0, 0.5, 0.1), // Bright orange
vec3(0.9, 0.4, 0.1), // Dark orange
vec3(0.8, 0.3, 0.1), // Burnt orange
vec3(1.0, 0.6, 0.2) // Light orange
);

const int paletteLength = 32;
const float saturationSteps = 16.0;
const float lightnessSteps = 16.0;

float hueToRgb(float f1, float f2, float hue) {
  if(hue < 0.0)
    hue += 1.0;
  else if(hue > 1.0)
    hue -= 1.0;
  float res;
  if(6.0 * hue < 1.0)
    res = f1 + (f2 - f1) * 6.0 * hue;
  else if(2.0 * hue < 1.0)
    res = f2;
  else if(3.0 * hue < 2.0)
    res = f1 + (f2 - f1) * (2.0 / 3.0 - hue) * 6.0;
  else
    res = f1;
  return res;
}

vec3 hslToRgb(vec3 hsl) {
  vec3 rgb;

  if(hsl.y == 0.0)
    rgb = vec3(hsl.z); // Luminance
  else {
    float f2;

    if(hsl.z < 0.5)
      f2 = hsl.z * (1.0 + hsl.y);
    else
      f2 = hsl.z + hsl.y - hsl.y * hsl.z;

    float f1 = 2.0 * hsl.z - f2;

    rgb.r = hueToRgb(f1, f2, hsl.x + 1.0 / 3.0);
    rgb.g = hueToRgb(f1, f2, hsl.x);
    rgb.b = hueToRgb(f1, f2, hsl.x - 1.0 / 3.0);
  }
  return rgb;
}

vec3 rgbToHsl(vec3 color) {
  vec3 hsl; // init to 0 to avoid warnings ? (and reverse if + remove first part)

  float fmin = min(min(color.r, color.g), color.b); //Min. value of RGB
  float fmax = max(max(color.r, color.g), color.b); //Max. value of RGB
  float delta = fmax - fmin; //Delta RGB value

  hsl.z = (fmax + fmin) / 2.0; // Luminance

  if(delta ==
    0.0 //This is a gray, no chroma...
  ) {
    hsl.x = 0.0; // Hue
    hsl.y = 0.0; // Saturation
  } //Chromatic data...
  else {
    if(hsl.z < 0.5)
      hsl.y = delta / (fmax + fmin); // Saturation
    else
      hsl.y = delta / (2.0 - fmax - fmin); // Saturation

    float deltaR = ((fmax - color.r) / 6.0 + delta / 2.0) / delta;
    float deltaG = ((fmax - color.g) / 6.0 + delta / 2.0) / delta;
    float deltaB = ((fmax - color.b) / 6.0 + delta / 2.0) / delta;

    if(color.r == fmax)
      hsl.x = deltaB - deltaG; // Hue
    else if(color.g == fmax)
      hsl.x = 1.0 / 3.0 + deltaR - deltaB; // Hue
    else if(color.b == fmax)
      hsl.x = 2.0 / 3.0 + deltaG - deltaR; // Hue

    if(hsl.x < 0.0)
      hsl.x += 1.0; // Hue
    else if(hsl.x > 1.0)
      hsl.x -= 1.0; // Hue
  }

  return hsl;
}

float hueDistance(float h1, float h2) {
  float diff = abs(h1 - h2);
  return min(abs(1.0 - diff), diff);
}

float lightnessStep(float l) {
  return floor(0.5 + l * lightnessSteps) / lightnessSteps;
}

float SaturationStep(float s) {
  return floor(0.5 + s * saturationSteps) / saturationSteps;
}

vec3[2] closestColors(float hue) {
  vec3 ret[2];
  vec3 closest = vec3(-2, 0, 0);
  vec3 secondClosest = vec3(-2, 0, 0);
  vec3 temp;
  for(int i = 0; i < paletteLength; ++i) {
    temp = rgbToHsl(palette[i]);
    float tempDistance = hueDistance(temp.x, hue);
    if(tempDistance < hueDistance(closest.x, hue)) {
      secondClosest = closest;
      closest = temp;
    } else {
      if(tempDistance < hueDistance(secondClosest.x, hue)) {
        secondClosest = temp;
      }
    }
  }
  ret[0] = closest;
  ret[1] = secondClosest;
  return ret;
}

const float bayerMatrix8x8[64] = float[64](0.0 / 64.0, 48.0 / 64.0, 12.0 / 64.0, 60.0 / 64.0, 3.0 / 64.0, 51.0 / 64.0, 15.0 / 64.0, 63.0 / 64.0, 32.0 / 64.0, 16.0 / 64.0, 44.0 / 64.0, 28.0 / 64.0, 35.0 / 64.0, 19.0 / 64.0, 47.0 / 64.0, 31.0 / 64.0, 8.0 / 64.0, 56.0 / 64.0, 4.0 / 64.0, 52.0 / 64.0, 11.0 / 64.0, 59.0 / 64.0, 7.0 / 64.0, 55.0 / 64.0, 40.0 / 64.0, 24.0 / 64.0, 36.0 / 64.0, 20.0 / 64.0, 43.0 / 64.0, 27.0 / 64.0, 39.0 / 64.0, 23.0 / 64.0, 2.0 / 64.0, 50.0 / 64.0, 14.0 / 64.0, 62.0 / 64.0, 1.0 / 64.0, 49.0 / 64.0, 13.0 / 64.0, 61.0 / 64.0, 34.0 / 64.0, 18.0 / 64.0, 46.0 / 64.0, 30.0 / 64.0, 33.0 / 64.0, 17.0 / 64.0, 45.0 / 64.0, 29.0 / 64.0, 10.0 / 64.0, 58.0 / 64.0, 6.0 / 64.0, 54.0 / 64.0, 9.0 / 64.0, 57.0 / 64.0, 5.0 / 64.0, 53.0 / 64.0, 42.0 / 64.0, 26.0 / 64.0, 38.0 / 64.0, 22.0 / 64.0, 41.0 / 64.0, 25.0 / 64.0, 37.0 / 64.0, 21.0 / 64.0);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 456.21);
  return fract(p.x * p.y);
}

vec3 dither(vec2 voxelPixelCoord, vec3 color, vec2 voxelUv) {
  vec3 originalColor = color;
  color = rgbToHsl(color);

  int x = int(mod(voxelPixelCoord.x / uPixelSize, 8.0));
  int y = int(mod(voxelPixelCoord.y / uPixelSize, 8.0));

  float threshold = bayerMatrix8x8[x * 8 + y] + uBias;

  // Add random noise based on uv coordinates and uNoiseFactor
  float noise = hash(voxelUv) * 2.0 - 1.0; // Generate noise between -1 and 1
  color.z += noise * uNoiseFactor * 0.1; // Apply noise to lightness channel
  color.z = clamp(color.z, 0.0, 1.0); // Clamp lightness to valid range

  vec3[2] Colors = closestColors(color.x);

  float hueDiff = hueDistance(color.x, Colors[0].x) / hueDistance(Colors[1].x, Colors[0].x);

  float l1 = lightnessStep(max(color.z - 1.0 / saturationSteps * 0.51, 0.0));
  float l2 = lightnessStep(min(color.z + 1.0 / saturationSteps * 0.49, 1.0));
  float lightnessDiff = (color.z - l1) / (l2 - l1);

  float s1 = SaturationStep(max(color.y - 1.0 / saturationSteps * 0.51, 0.0));
  float s2 = SaturationStep(min(color.y + 1.0 / saturationSteps * 0.49, 1.0));

  float SaturationDiff = (color.y - s1) / (s2 - s1);

  vec3 resultColor = hueDiff < threshold ? Colors[0] : Colors[1];
  resultColor.y = SaturationDiff <= threshold ? s1 : s2;
  resultColor.z = lightnessDiff <= threshold ? l1 : l2;

  resultColor = hslToRgb(resultColor);

  // Blend based on lightness
  float luminance = dot(originalColor, vec3(0.299, 0.587, 0.114));
  float ditherFactor = 1.0 - pow(luminance, 0.5);

  // resultColor = resultColor * originalColor;

  resultColor = mix(originalColor, resultColor, uColorMultiplier * ditherFactor);

  return resultColor;
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

vec3 tonemap(vec3 color) {
  color = contrast(color, uContrast);
  color = invertedGamma(color, uGamma);
  color = ACESFilmicToneMapping(color);
  return color;
}

void main() {
  // Voxelize UV coordinates
  vec2 voxel = floor(vUv * resolution / uPixelSize);
  vec2 voxelPixelCoord = voxel * uPixelSize;
  vec2 voxelUv = voxelPixelCoord / resolution;

  vec4 baseColorSample = texture2D(uMainTexture, voxelUv);
  vec3 color = baseColorSample.rgb;

  color.rgb *= uBrightness;

  color = tonemap(color);

  //color.rgb = dither(voxelPixelCoord, color, voxelUv);

  // Apply bloom effect with chess pattern
  vec3 bloom = vec3(0.0);
  float totalWeight = 0.0;
  float phi = hash(voxelUv) * 6.28; // Random rotation angle

  // Create chess pattern
  float chessPattern = mod(voxel.x + voxel.y, 2.0);

  for(int i = 1; i < SAMPLE_COUNT; i++) {
    vec2 sampleOffset = vogelDiskSample(i, SAMPLE_COUNT, phi) * uBloomRadius / resolution;
    float dist = length(sampleOffset);

    // Gaussian-like falloff
    float weight = 1.0 / dist;

    // Sample color at offset position
    vec3 sampleColor = texture2D(uMainTexture, voxelUv + sampleOffset).rgb;

    // Only add to bloom if brightness is above threshold
    float brightness = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
    totalWeight += weight;
    if(brightness > uBloomThreshold)
      bloom += sampleColor * weight;
  }

  // Normalize bloom and apply chess pattern
  bloom /= totalWeight + 0.0001;
  vec3 bloomColor = bloom * uBloomStrength * chessPattern;

  // Add bloom to result with strength control
  color += bloomColor;
  color = clamp(color, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);

  #include <colorspace_fragment>
}
