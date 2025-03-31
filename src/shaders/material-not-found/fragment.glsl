uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 resolution;

varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 shakeOffset(float time, float intensity) {
  vec2 shake = vec2(
    random(vec2(time * 0.3)) * 2.0 - 1.0,
    random(vec2(time * 0.2)) * 2.0 - 1.0
  );

  float shakeBurst = step(0.58, random(vec2(floor(time * 0.5))));
  return shake * intensity * shakeBurst;
}

void main() {
  float shakeIntensity = 0.0005;
  vec2 shake = shakeOffset(uTime, shakeIntensity);

  vec2 uv2 = vUv + shake;
  uv2.x = 1.0 - uv2.x;
  uv2 -= 0.5;
  float cosR = -1.0;
  float sinR = 0.0;
  vec2 shiftedUv = vec2(
    uv2.x * cosR - uv2.y * sinR,
    uv2.x * sinR + uv2.y * cosR
  );
  shiftedUv += 0.5;

  vec4 color = texture2D(tDiffuse, shiftedUv);

  vec4 colorBleedUp = texture2D(tDiffuse, shiftedUv + vec2(0.0, 0.001));
  vec4 colorBleedDown = texture2D(tDiffuse, shiftedUv - vec2(0.0, 0.001));
  color += (colorBleedUp + colorBleedDown) * 0.5;

  float scanline = sin(vUv.y * resolution.y * 0.45 - uTime * 15.0);
  color.rgb += color.rgb * scanline * 0.35;

  float noise = random(vUv + uTime * 5.0);
  color.rgb += noise * 0.15;

  color.rgb += sin(vUv.y * 10.0 + uTime * 10.0) * 0.02;

  float grayscale = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  vec3 tint = vec3(0.898, 0.898, 0.898) * 3.0;
  gl_FragColor = vec4(vec3(grayscale) * tint, color.a);
}
