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

// Constantes adicionales precalculadas
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

// Optimizamos la función RRTAndODTFit para reducir operaciones
vec3 RRTAndODTFit(vec3 v) {
  // Constantes precalculadas
  const float c1 = 0.0245786;
  const float c2 = -0.000090537;
  const float c3 = 0.983729;
  const float c4 = 0.432951;
  const float c5 = 0.238081;

  // Operaciones organizadas para minimizar cálculos
  vec3 v2 = v * v;
  vec3 a = v * c1 + v2 + c2;
  vec3 b = v * c4 + v2 * c3 + c5;

  return a / b;
}

vec3 ACESFilmicToneMapping(vec3 color) {
  // Constantes precalculadas para la exposición
  const float EXPOSURE_ADJUST = 1.0 / 0.6;

  // Matrices transpuestas para optimizar multiplicaciones
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

  // Aplicar exposición ajustada
  color *= uExposure * EXPOSURE_ADJUST;

  // Multiplicación de matriz optimizada (omitir multiplicaciones por 0)
  vec3 colorTransformed;

  // Primera transformación: ACESInputMat * color
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

  // Segunda transformación: ACESOutputMat * colorTransformed
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
  // Aplicamos brillo - aquí seguimos usando multiplicación directa
  color.rgb *= uBrightness;

  // Aplicamos contraste
  color = contrast(color, uContrast);

  // Aplicamos corrección gamma invertida
  color = invertedGamma(color, uGamma);

  // Aplicamos ACES Filmic Tone Mapping optimizado
  color = ACESFilmicToneMapping(color);

  return color;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float blend(const float x, const float y) {
  // Usando mix con step para reducir la ramificación
  return mix(2.0 * x * y, 1.0 - 2.0 * (1.0 - x) * (1.0 - y), step(0.5, x));
}

vec3 blend(const vec3 x, const vec3 y, const float opacity) {
  // Usando la versión optimizada de blend
  vec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));

  // Optimización: uso directo del lerp/mix en lugar de operaciones manuales
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

  vec2 pixelatedUv = floor(vUv * halfResolution) * 2.0 / resolution;

  vec4 baseColorSample = texture2D(uMainTexture, vUv);

  vec4 basePixelatedSample = texture2D(
    uMainTexture,
    floor(vUv * eighthResolution) * 8.0 / resolution
  );

  float baseBrightness = dot(
    tonemap(basePixelatedSample.rgb),
    LUMINANCE_FACTORS
  );

  float alpha = 1.0;
  float reveal = 1.0 - uOpacity;
  reveal = clamp(reveal, 0.0, 1.0);

  reveal = reveal * reveal;
  reveal = reveal * reveal;

  if (baseBrightness < reveal || uOpacity == 0.0) {
    alpha = 0.0;
  }

  vec3 color = baseColorSample.rgb;

  color = tonemap(color);

  // Precalcular inverso de resolution para evitar divisiones repetidas
  vec2 invResolution = 1.0 / resolution;
  vec2 uvOffset = invResolution; // Antes era vec2(1.0 / resolution.x, 1.0 / resolution.y)

  // Restauramos el cálculo del bloom como estaba originalmente
  vec3 bloomColor = vec3(0.0);

  if (uBloomStrength > 0.001 && checkerPattern > 0.5) {
    // Apply bloom effect only when bloom strength is significant and on checker pattern
    vec3 bloom = vec3(0.0);
    float totalWeight = 0.0;
    float phi = hash(pixelatedUv) * PI_2; // Random rotation angle, usando constante precalculada

    // Precalculamos la división de uBloomRadius por resolution
    vec2 bloomRadiusScaled = uBloomRadius * invResolution;

    for (int i = 1; i < SAMPLE_COUNT; i++) {
      vec2 sampleOffset =
        vogelDiskSample(i, SAMPLE_COUNT, phi) * bloomRadiusScaled;
      float dist = length(sampleOffset);

      // Gaussian-like falloff - se evita la división cuando dist es muy pequeño
      float weight = dist > 0.001 ? 1.0 / dist : 1000.0;

      // Sample color at offset position - usamos las coordenadas precalculadas
      vec3 sampleColor = texture2D(
        uMainTexture,
        pixelatedUv + sampleOffset + uvOffset
      ).rgb;

      // Only add to bloom if brightness is above threshold
      float brightness = dot(sampleColor, LUMINANCE_FACTORS);

      // Evitar bifurcación condicional que puede ser costosa en GPUs
      // Usar una versión de step() para simular el if-statement
      float shouldAdd = step(uBloomThreshold, brightness);
      totalWeight += weight;
      bloom += sampleColor * weight * shouldAdd;
    }

    // Normalize bloom and apply strength - evitamos la multiplicación por checkerPattern (ya lo verificamos en el if)
    float safeWeight = max(totalWeight, 0.0001); // Evita la suma constante
    bloomColor = bloom / safeWeight * uBloomStrength;
  }

  // Add bloom to result with strength control
  color += bloomColor;
  color = clamp(color, 0.0, 1.0);

  // Restauramos la aplicación original del viñeteado
  float vignetteFactor = getVignetteFactor(vUv);
  color = mix(color, vec3(0.0), vignetteFactor);

  gl_FragColor = vec4(color, alpha);

  #include <colorspace_fragment>
}
