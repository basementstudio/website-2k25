precision mediump float;

uniform sampler2D map;
varying vec2 vUv;

#define TINT_R (1.33)
#define TINT_G (0.33)

#define BRIGHTNESS (8.0)
#define LUMA_INTENSITY (1.5)

void main() {
  vec3 color = texture2D(map, vUv).rgb;

  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  luma = pow(luma, 1.0 / LUMA_INTENSITY);

  vec3 tint = vec3(1.0, 0.302, 0.0); // base color #FF4D00
  tint.r *= TINT_R;
  tint.g *= TINT_G;

  color.rgb = luma * tint * BRIGHTNESS;

  gl_FragColor = vec4(color, 1.0);
}
