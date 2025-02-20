uniform sampler2D map;
uniform float uTime;
uniform float uRevealProgress;
varying vec2 vUv;

#define TINT_R (1.33)
#define TINT_G (0.11)
#define BRIGHTNESS (15.0)
#define SCANLINE_INTENSITY (0.5)
#define SCANLINE_COUNT (800.0)
#define VIGNETTE_STRENGTH (0.1)
#define DISTORTION (0.3)
#define NOISE_INTENSITY (0.5)
#define TIME_SPEED (1.0)
#define LINE_HEIGHT (0.05)
#define MASK_INTENSITY (0.3)
#define MASK_SIZE (8.0)
#define MASK_BORDER (0.4)

vec2 curveRemapUV(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) / vec2(5.0, 5.0);
  uv = uv + uv * offset * offset * DISTORTION;
  uv = uv * 0.5 + 0.5;
  return uv;
}

// random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 applyCRTMask(vec3 color, vec2 uv, vec2 resolution) {
  vec2 coord = uv * resolution / MASK_SIZE;
  float xCoord = coord.x * 6.0;

  float ind = mod(floor(xCoord), 3.0);
  float blend = smoothstep(0.3, 0.7, fract(xCoord));

  vec3 mask_color1, mask_color2;

  if (ind == 0.0) {
    mask_color1 = vec3(1.2, 0.3, 0.0) * 2.0;
    mask_color2 = vec3(0.6, 0.1, 0.0) * 2.0;
  } else if (ind == 1.0) {
    mask_color1 = vec3(0.6, 0.1, 0.0) * 2.0;
    mask_color2 = vec3(0.3, 0.05, 0.0) * 2.0;
  } else {
    mask_color1 = vec3(0.3, 0.05, 0.0) * 2.0;
    mask_color2 = vec3(1.2, 0.3, 0.0) * 2.0;
  }

  // blend between adjacent mask colors
  vec3 mask_color = mix(mask_color1, mask_color2, blend);

  float maskIntensity = MASK_INTENSITY * 1.5;
  return color * (1.0 + (mask_color - 1.0) * maskIntensity);
}

void main() {
  // add curved uv
  vec2 remappedUv = curveRemapUV(vUv);
  vec3 textureColor = vec3(0.0);

  // texture boundaries
  if (
    remappedUv.x >= 0.0 &&
    remappedUv.x <= 1.0 &&
    remappedUv.y >= 0.0 &&
    remappedUv.y <= 1.0
  ) {
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

  // start with black background and blend with revealed texture
  vec3 color = mix(vec3(0.0), textureColor, textureVisibility);

  // add noise that's always visible (reduced intensity)
  float noise = random(vUv + vec2(uTime * TIME_SPEED)) * NOISE_INTENSITY;
  color += noise * 0.1;

  // add scanlines that are always visible (reduced intensity)
  float scanline = sin(vUv.y * SCANLINE_COUNT) * 0.5 + 0.5;
  color += (1.0 - scanline * SCANLINE_INTENSITY) * 0.05;

  // add vignette
  vec2 vignetteUv = vUv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vignetteUv, vignetteUv) * VIGNETTE_STRENGTH;
  color *= vignette;

  // add crt
  color = applyCRTMask(color, vUv, vec2(1024.0, 1024.0));

  gl_FragColor = vec4(color, 1.0);
}
