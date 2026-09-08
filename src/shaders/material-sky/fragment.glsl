precision highp float;

varying vec3 vWorldPosition;

uniform sampler2D uSkyLut;
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunDiscIntensity;
uniform float uSunGlowIntensity;
uniform float uCloudCover;
uniform vec2 uCloudOffset;
uniform vec3 uCloudColorZenith;
uniform vec3 uCloudColorHorizon;
uniform float uNightFactor;
uniform float uLightning;

const float PI = 3.141592653589793;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm4(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise(p);
    p = p * 2.03 + vec2(17.13, 9.71);
    a *= 0.5;
  }
  return v;
}

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

vec2 dirToLutUv(vec3 rd) {
  float az = atan(rd.x, rd.z);
  float el = asin(clamp(rd.y, -1.0, 1.0));
  float t = sign(el) * sqrt(abs(el) / (PI * 0.5));
  return vec2(az / (2.0 * PI), 0.5 + 0.5 * t);
}

float stars(vec3 rd, float time) {
  vec2 suv = vec2(
    atan(rd.x, rd.z) / (2.0 * PI) + 0.5,
    asin(clamp(rd.y, -1.0, 1.0)) / PI + 0.5
  );
  vec2 grid = suv * vec2(220.0, 110.0);
  vec2 cell = floor(grid);
  float h = hash12(cell);
  if (h > 0.06) return 0.0;
  vec2 starPos = hash22(cell) * 0.6 + 0.2;
  float d = length(fract(grid) - starPos);
  float twinkle = 0.7 + 0.3 * sin(time * (1.0 + h * 40.0) + h * 100.0);
  return smoothstep(0.12, 0.0, d) * twinkle * smoothstep(0.06, 0.0, h);
}

void main() {
  vec3 rd = normalize(vWorldPosition - cameraPosition);

  float below = smoothstep(0.0, -0.1, rd.y);
  vec3 rdSky = rd.y < 0.015 ? normalize(vec3(rd.x, 0.015, rd.z)) : rd;

  vec4 lut = texture2D(uSkyLut, dirToLutUv(rdSky));
  vec3 col = lut.rgb;

  float cloudA = 0.0;
  if (rd.y > 0.02) {
    vec2 cuv = rd.xz / (rd.y + 0.15) * 0.6 + uCloudOffset;
    float f = fbm4(cuv) * 1.0667;
    float th = mix(0.78, 0.25, uCloudCover);
    float coverage = smoothstep(th, th + 0.18, f);
    cloudA = coverage * smoothstep(0.02, 0.12, rd.y);
    vec3 cloudCol = mix(
      uCloudColorHorizon,
      uCloudColorZenith,
      clamp(rd.y * 1.5, 0.0, 1.0)
    );
    col = mix(col, cloudCol, cloudA * 0.85);
  }

  if (uLightning > 0.001) {
    col += vec3(0.85, 0.9, 1.1) * uLightning * (0.35 + cloudA * 1.4);
  }

  float cosSun = dot(rd, uSunDir);
  float disc = smoothstep(cos(0.01), cos(0.008), cosSun);
  float glow = pow(max(cosSun, 0.0), 350.0);
  float sunOcclusion = (1.0 - cloudA) * (1.0 - uCloudCover * 0.85);
  col +=
    uSunColor *
    (disc * uSunDiscIntensity + glow * uSunGlowIntensity) *
    sunOcclusion;

  if (uNightFactor > 0.001 && rd.y > 0.0) {
    col +=
      vec3(stars(rd, uTime)) *
      uNightFactor *
      lut.a *
      (1.0 - cloudA) *
      smoothstep(0.0, 0.03, rd.y) *
      1.5;
  }

  col *= 1.0 - 0.45 * below;

  col += vec3((ign(gl_FragCoord.xy) - 0.5) * (1.0 / 128.0));

  gl_FragColor = vec4(col, 1.0);
}
