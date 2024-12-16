#pragma glslify: blendScreen = require(glsl-blend/screen)
precision highp float;

uniform sampler2D map;
uniform sampler2D reflectionMap;
uniform float reflectionOpacity;
uniform float uColorNum;
uniform float uPixelSize;
uniform float uTime;
uniform float uNoiseIntensity;
uniform float uScanlineIntensity;
uniform float uScanlineFrequency;
uniform bool uIsMonochrome;
uniform vec3 uMonochromeColor;

varying vec2 vUv;

float random(vec2 c) {
  return fract(sin(dot(c.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 curveUV = vUv * 2.0 - 1.0;
  vec2 offset = curveUV.yx * 0.15;
  curveUV += curveUV * offset * offset;
  curveUV = curveUV * 0.5 + 0.5;

  // Add shake effect here
  float shake =
    (noise(vec2(curveUV.y) * sin(uTime * 400.0) * 100.0) - 0.5) * 0.0025;
  curveUV.x += shake * 0.5;

  vec2 pixelUV = floor(curveUV * uPixelSize) / uPixelSize;

  vec4 color = texture2D(map, pixelUV);

  if (uIsMonochrome) {
    float gray = dot(color.rgb, vec3(0.4, 0.5, 0.1));
    gray = floor(gray * (uColorNum * 3.0) + 0.5) / (uColorNum * 3.0);
    vec3 adjustedColor = uMonochromeColor;
    adjustedColor.r *= 1.2;
    adjustedColor.g *= 0.9;
    color.rgb = gray * adjustedColor * 3.5;
  } else {
    color.r =
      floor(color.r * (uColorNum * 1.5 - 1.0) + 0.5) / (uColorNum * 1.5 - 1.0);
    color.g =
      floor(color.g * (uColorNum * 1.5 - 1.0) + 0.5) / (uColorNum * 1.5 - 1.0);
    color.b =
      floor(color.b * (uColorNum * 1.5 - 1.0) + 0.5) / (uColorNum * 1.5 - 1.0);
  }

  // Add scanlines
  float scanLine = sin(curveUV.y * uScanlineFrequency) * uScanlineIntensity;
  color.rgb *= 1.0 - scanLine;

  // Add noise
  float noise = random(curveUV + uTime) * uNoiseIntensity;
  color.rgb = mix(color.rgb, vec3(0.0), noise);

  // Add vignette
  vec2 vignetteUV = curveUV * (1.0 - curveUV.yx);
  float vignette = vignetteUV.x * vignetteUV.y * 15.0;
  vignette = pow(vignette, 0.25);
  color.rgb *= vignette;

  vec2 edge =
    smoothstep(0.0, 0.005, curveUV) *
    (1.0 - smoothstep(1.0 - 0.005, 1.0, curveUV));
  color.rgb *= edge.x * edge.y;

  vec4 reflectionColor = texture2D(reflectionMap, vec2(1.0 - vUv));
  color.rgb = blendScreen(
    color.rgb,
    reflectionColor.rgb,
    reflectionOpacity * (1.0 - vUv.x)
  );

  gl_FragColor = color;
}
