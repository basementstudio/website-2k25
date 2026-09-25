precision highp float;

const int SAMPLE_COUNT = 24;
const vec3 LUMINANCE_FACTORS = vec3(0.2126, 0.7152, 0.0722);
const float GOLDEN_ANGLE = 2.399963229728653;
const float PI_2 = 6.28318530718; // 2*PI

uniform sampler2D uMainTexture;
uniform vec2 resolution;

uniform float uBloomStrength;
uniform float uBloomRadius;
uniform float uBloomThreshold;
uniform float uActiveBloom;

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

void main() {
  vec2 cell = floor(gl_FragCoord.xy);

  float checkerPattern = mod(cell.x + cell.y, 2.0);

  if (
    uBloomStrength <= 0.001 ||
    uActiveBloom <= 0.5 ||
    checkerPattern <= 0.5
  ) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec2 invResolution = 1.0 / resolution;
  vec2 pixelatedUv = cell * 2.0 * invResolution;

  vec3 bloom = vec3(0.0);
  float totalWeight = 0.0;
  float phi = hash(pixelatedUv) * PI_2; // Random rotation angle

  // Precalculate the division of uBloomRadius by resolution
  vec2 bloomRadiusScaled = uBloomRadius * invResolution;

  for (int i = 1; i < SAMPLE_COUNT; i++) {
    vec2 sampleOffset =
      vogelDiskSample(i, SAMPLE_COUNT, phi) * bloomRadiusScaled;
    float dist = length(sampleOffset);

    // Gaussian-like falloff - avoid division when dist is very small
    float weight = dist > 0.001 ? 1.0 / dist : 1000.0;

    vec3 sampleColor = texture2D(
      uMainTexture,
      pixelatedUv + sampleOffset + invResolution
    ).rgb;

    float brightness = dot(sampleColor, LUMINANCE_FACTORS);
    float shouldAdd = step(uBloomThreshold, brightness);

    totalWeight += weight;
    bloom += sampleColor * weight * shouldAdd;
  }

  float safeWeight = max(totalWeight, 0.0001);
  gl_FragColor = vec4(bloom / safeWeight * uBloomStrength, 1.0);
}
