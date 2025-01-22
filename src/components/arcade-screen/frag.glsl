precision mediump float;

uniform sampler2D map;
varying vec2 vUv;

#define CURVE_Y (0.1)
#define CURVE_X (0.1)

#define TINT_R (1.33)
#define TINT_G (0.33)

#define BRIGHTNESS (8.0)
#define LUMA_INTENSITY (1.5)

vec2 curveUV(vec2 uv) {
  vec2 curvedUv = uv * 2.0 - 1.0;
  vec2 offset = abs(curvedUv.yx) * vec2(CURVE_Y, CURVE_X);
  curvedUv = curvedUv + curvedUv * offset * offset;
  curvedUv = curvedUv * 0.5 + 0.5;

  return curvedUv;
}

void main() {
  vec2 curvedUv = curveUV(vUv);

  // Discard pixels outside the curved area
  if (
    curvedUv.x < 0.0 ||
    curvedUv.x > 1.0 ||
    curvedUv.y < 0.0 ||
    curvedUv.y > 1.0
  ) {
    discard;
  }

  vec3 color = texture2D(map, curvedUv).rgb;

  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  luma = pow(luma, 1.0 / LUMA_INTENSITY);

  vec3 tint = vec3(1.0, 0.302, 0.0); // base color #FF4D00
  tint.r *= TINT_R;
  tint.g *= TINT_G;

  color.rgb = luma * tint * BRIGHTNESS;

  gl_FragColor = vec4(color, 1.0);
}
