precision highp float;

const vec3 LUMINANCE_FACTORS = vec3(0.2126, 0.7152, 0.0722);

uniform sampler2D uMainTexture;
uniform sampler2D uDepthTexture;
uniform vec2 resolution;
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
uniform sampler2D uBloomTexture;
uniform vec2 uBloomResolution;

// Color mask (basketball)
uniform vec2 uEllipseCenter;
uniform vec2 uEllipseSize;
uniform float uEllipseSoftness;
uniform bool uDebugEllipse;

// 404
uniform float u404Transition;

uniform float uTime;

// Ground fog (Halloween) — off while uFogAmount is 0.
uniform float uFogAmount;
uniform vec3 uFogColor;
uniform mat4 uCameraProjectionInverse;
uniform mat4 uCameraWorld;

const float DENSITY = 0.9;
const float OPACITY_SCANLINE = 0.24;
const float OPACITY_NOISE = 0.01;

varying vec2 vUv;

float getVignetteFactor(vec2 uv) {
  vec2 center = vec2(0.5, 0.5);
  float radius = uVignetteRadius;
  float spread = uVignetteSpread;

  float vignetteFactor =
    1.0 - smoothstep(radius, radius - spread, length(uv - center));
  return vignetteFactor;
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

// --- Ground fog ------------------------------------------------------------
// Reconstructs each pixel's world position from the depth buffer and marches
// the camera ray through two slabs of animated noise: the ground floor and the
// upstairs floor. Depth-based, so it wraps whatever it touches without the
// hard intersection lines fog sprites would draw.

const int FOG_STEPS = 6;
const float FOG_HEIGHT = 0.9;
const float UPSTAIRS_Y = 3.73;

float fogHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float fogNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(fogHash(i), fogHash(i + vec3(1, 0, 0)), f.x),
      mix(fogHash(i + vec3(0, 1, 0)), fogHash(i + vec3(1, 1, 0)), f.x),
      f.y
    ),
    mix(
      mix(fogHash(i + vec3(0, 0, 1)), fogHash(i + vec3(1, 0, 1)), f.x),
      mix(fogHash(i + vec3(0, 1, 1)), fogHash(i + vec3(1, 1, 1)), f.x),
      f.y
    ),
    f.z
  );
}

// Density at p, h being the height above the slab's floor.
float fogDensity(vec3 p, float h) {
  vec3 drift = vec3(uTime * 0.07, uTime * 0.015, uTime * 0.04);
  float n =
    fogNoise(p * 0.55 + drift) * 0.65 + fogNoise(p * 1.7 - drift * 1.7) * 0.35;
  // Thick at the floor, thinning out upward; the noise eats the top so the
  // surface reads as rolling wisps instead of a flat sheet.
  // The fade to 0 at FOG_HEIGHT keeps the slab's top from drawing a hard
  // horizon line where the camera sees it edge-on.
  float falloff = exp(-h * 3.2) * (1.0 - smoothstep(0.35, 1.0, h / FOG_HEIGHT));
  return falloff * smoothstep(0.42, 0.75, n + falloff * 0.2);
}

// Upstairs footprint — the ground floor's front half is double height, so a
// slab at UPSTAIRS_Y there would hang in mid-air.
float upstairsMask(vec3 p) {
  return step(p.z, -14.55) * step(1.86, p.x) * step(p.x, 13.12);
}

// Front-to-back march of [tNear, tFar] along the ray; accumulates into
// scatter/transmittance.
void marchFogSlab(
  vec3 ro,
  vec3 rd,
  float floorY,
  float tMax,
  bool upstairs,
  float jitter,
  inout vec3 scatter,
  inout float transmittance
) {
  // Clip the ray to floorY <= y <= floorY + FOG_HEIGHT.
  float t0 = 0.0;
  float t1 = tMax;
  if (abs(rd.y) > 1e-4) {
    float ta = (floorY - ro.y) / rd.y;
    float tb = (floorY + FOG_HEIGHT - ro.y) / rd.y;
    t0 = max(t0, min(ta, tb));
    t1 = min(t1, max(ta, tb));
  } else if (ro.y < floorY || ro.y > floorY + FOG_HEIGHT) {
    return;
  }
  if (t1 <= t0) return;

  float stepLen = (t1 - t0) / float(FOG_STEPS);
  for (int i = 0; i < FOG_STEPS; i++) {
    vec3 p = ro + rd * (t0 + stepLen * (float(i) + jitter));
    float mask = upstairs ? upstairsMask(p) : 1.0;
    float d = fogDensity(p, max(p.y - floorY, 0.0)) * mask * uFogAmount;
    float absorb = exp(-d * stepLen);
    // Wisps catch a bit more light than the thin haze between them.
    scatter += transmittance * (1.0 - absorb) * uFogColor * (0.7 + d);
    transmittance *= absorb;
  }
}

vec3 applyFog(vec3 color, vec2 uv) {
  float depth = texture2D(uDepthTexture, uv).x;
  vec4 view = uCameraProjectionInverse * vec4(vec3(uv, depth) * 2.0 - 1.0, 1.0);
  view /= view.w;
  vec3 world = (uCameraWorld * view).xyz;
  vec3 ro = uCameraWorld[3].xyz;
  vec3 toPixel = world - ro;
  // Sky/background: cap the distance so it doesn't march to the far plane.
  float tMax = min(length(toPixel), 40.0);
  vec3 rd = normalize(toPixel);

  // Per-pixel jitter trades the step banding for grain, which the post
  // stack's dithering already hides.
  float jitter = random(uv * resolution + fract(uTime) * 61.0);

  vec3 scatter = vec3(0.0);
  float transmittance = 1.0;
  marchFogSlab(ro, rd, 0.0, tMax, false, jitter, scatter, transmittance);
  marchFogSlab(ro, rd, UPSTAIRS_Y, tMax, true, jitter, scatter, transmittance);
  return color * transmittance + scatter;
}

void main() {
  // Precalculate resolution divisions
  vec2 halfResolution = resolution / 2.0;
  vec2 eighthResolution = resolution / 8.0;

  // Calculate pixelated coordinates only once
  vec2 pixelatedUvEighth = floor(vUv * eighthResolution) * 8.0 / resolution;

  // Optimized texture reading
  vec4 baseColorSample = texture2D(uMainTexture, vUv);
  vec3 color = baseColorSample.rgb;

  if (uFogAmount > 0.0) color = applyFog(color, vUv);

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

  vec2 bloomCell = floor(vUv * halfResolution);
  vec3 bloomColor = texture2D(
    uBloomTexture,
    (bloomCell + 0.5) / uBloomResolution
  ).rgb;

  // Add bloom to result with strength control
  color += bloomColor;
  color = clamp(color, 0.0, 1.0);

  // The vignette application remains exactly the same
  float vignetteFactor = getVignetteFactor(vUv);
  color = mix(color, vec3(0.0), vignetteFactor);

  gl_FragColor = vec4(color, alpha);

  #include <colorspace_fragment>
}
