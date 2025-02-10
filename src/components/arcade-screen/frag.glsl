uniform sampler2D map;
uniform float uTime;
varying vec2 vUv;

#define TINT_R (1.33)
#define TINT_G (0.11)
#define BRIGHTNESS (15.0)
#define SCANLINE_INTENSITY (0.5)
#define SCANLINE_COUNT (800.0)
#define VIGNETTE_STRENGTH (0.1)
#define DISTORTION (0.2)
#define NOISE_INTENSITY (0.05)
#define TIME_SPEED (1.0)

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

  vec3 color = texture2D(map, remappedUv).rgb;
  float luma = dot(color, vec3(0.8, 0.1, 0.1));

  // apply tint
  vec3 tint = vec3(1.0, 0.302, 0.0);
  tint.r *= TINT_R;
  tint.g *= TINT_G;
  color.rgb = luma * tint * BRIGHTNESS;

  // add scanlines
  float scanline = sin(remappedUv.y * SCANLINE_COUNT) * 0.5 + 0.5;
  color *= 1.0 - scanline * SCANLINE_INTENSITY;

  // add noise
  float noise = random(remappedUv + vec2(uTime * TIME_SPEED)) * NOISE_INTENSITY;
  color += noise;

  // add vignette
  vec2 vignetteUv = remappedUv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vignetteUv, vignetteUv) * VIGNETTE_STRENGTH;
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
