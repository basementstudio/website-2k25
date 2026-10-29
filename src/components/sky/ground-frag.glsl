uniform sampler2D uSkyLut;
uniform vec3 uOutdoorTint;
uniform float fadeFactor;

varying vec3 vWorldPosition;

const float PI = 3.141592653589793;

void main() {
  vec3 ray = vWorldPosition - cameraPosition;
  vec3 rd = normalize(ray);
  // Match the sky's below-horizon lookup and dimming so distant ground
  // disappears into atmospheric haze before either camera's far clip.
  vec2 horizonUv = vec2(
    atan(rd.x, rd.z) / (2.0 * PI),
    0.5 + 0.5 * sqrt(asin(0.015) / (PI * 0.5))
  );
  float below = 1.0 - smoothstep(-0.1, 0.0, rd.y);
  vec3 horizon = texture2D(uSkyLut, horizonUv).rgb * (1.0 - 0.45 * below);
  vec3 ground = vec3(0.11, 0.115, 0.12) * uOutdoorTint;
  float haze = smoothstep(35.0, 170.0, length(ray.xz));
  gl_FragColor = vec4(mix(ground, horizon, haze) * (1.0 - fadeFactor), 1.0);
}
