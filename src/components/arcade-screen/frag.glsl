uniform sampler2D map;
uniform float uTime;
uniform float uRevealProgress;
uniform bool isRGBMonochrome;
varying vec2 vUv;

#define TINT_R (1.33)
#define TINT_G (0.11)
#define BRIGHTNESS (15.0)
#define SCANLINE_INTENSITY (0.5)
#define SCANLINE_COUNT (800.0)
#define VIGNETTE_STRENGTH (0.1)
#define DISTORTION (0.3)
#define NOISE_INTENSITY (0.05)
#define TIME_SPEED (1.0)
#define LINE_HEIGHT (0.05)
#define MASK_INTENSITY (0.3)
#define MASK_SIZE (12.0)
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
  // RGB cell and subcell coordinates
  vec2 coord = uv * resolution / MASK_SIZE;
  vec2 subcoord = coord * vec2(6.0, 1.0);

  // Offset for staggering every other cell
  vec2 cell_offset = vec2(0.0, fract(floor(coord.x) * 0.5));

  // Compute the RGB color index from 0 to 2
  float ind = mod(floor(subcoord.x), 3.0);
  // Convert that value to an RGB color (multiplied to maintain brightness)
  vec3 mask_color;
  if (isRGBMonochrome) {
    if (ind == 0.0) {
      mask_color = vec3(1.5, 0.6, 0.0) * 3.0;
    } else if (ind == 1.0) {
      mask_color = vec3(0.8, 0.2, 0.0) * 3.0;
    } else {
      mask_color = vec3(0.4, 0.1, 0.0) * 3.0;
    }
  } else {
    // Original RGB mask
    mask_color = vec3(ind == 0.0, ind == 1.0, ind == 2.0) * 3.0;
  }

  // Signed subcell uvs
  vec2 cell_uv = fract(subcoord + cell_offset) * 2.0 - 1.0;
  // X and y borders - using power of 4 instead of 2 for sharper transitions
  vec2 border = 1.0 - cell_uv * cell_uv * cell_uv * cell_uv * MASK_BORDER;
  // Blend x and y mask borders
  mask_color *= border.x * border.y;

  float maskIntensity = isRGBMonochrome ? MASK_INTENSITY * 1.5 : MASK_INTENSITY;
  return color * (1.0 + (mask_color - 1.0) * maskIntensity);
}

void main() {
  // curve remap
  vec2 remappedUv = curveRemapUV(vUv);

  // discard pixels outside the curved area
  if (
    remappedUv.x < 0.0 ||
    remappedUv.x > 1.0 ||
    remappedUv.y < 0.0 ||
    remappedUv.y > 1.0
  ) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // get texture color and apply tint
  vec3 textureColor = texture2D(map, remappedUv).rgb;
  float luma = dot(textureColor, vec3(0.8, 0.1, 0.1));
  vec3 tint = vec3(1.0, 0.302, 0.0);
  tint.r *= TINT_R;
  tint.g *= TINT_G;
  textureColor = luma * tint * BRIGHTNESS;

  // apply reveal to texture
  float currentLine = floor(remappedUv.y / LINE_HEIGHT);
  float revealLine = floor(uRevealProgress / LINE_HEIGHT);
  float textureVisibility = currentLine <= revealLine ? 0.8 : 0.0;

  // start with black background and blend with revealed texture
  vec3 color = mix(vec3(0.0), textureColor, textureVisibility);

  // add noise that's always visible (reduced intensity)
  float noise = random(remappedUv + vec2(uTime * TIME_SPEED)) * NOISE_INTENSITY;
  color += noise * 0.1;

  // add scanlines that are always visible (reduced intensity)
  float scanline = sin(remappedUv.y * SCANLINE_COUNT) * 0.5 + 0.5;
  color += (1.0 - scanline * SCANLINE_INTENSITY) * 0.05;

  // add vignette
  vec2 vignetteUv = remappedUv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vignetteUv, vignetteUv) * VIGNETTE_STRENGTH;
  color *= vignette;

  // Apply CRT RGB mask
  color = applyCRTMask(color, remappedUv, vec2(1024.0, 1024.0)); // Adjust resolution as needed

  gl_FragColor = vec4(color, 1.0);
}
