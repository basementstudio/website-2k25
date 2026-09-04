precision highp float;

// Sky display pass: runs every frame but only does cheap work — one LUT
// fetch plus sun disc, FBM clouds, stars and dither. The scattering integral
// lives in lut-fragment.glsl.

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
uniform vec3 uGroundColor;

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

// Interleaved gradient noise — kills banding in the dark night gradients.
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

vec2 dirToLutUv(vec3 rd) {
  // u wraps via RepeatWrapping (negative values are fine); v matches the
  // horizon-dense sqrt mapping baked into the LUT.
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

  vec4 lut = texture2D(uSkyLut, dirToLutUv(rd));
  vec3 col = lut.rgb;

  float cloudA = 0.0;
  if (rd.y > 0.02 && uCloudCover > 0.005) {
    vec2 cuv = rd.xz / (rd.y + 0.15) * 0.6 + uCloudOffset;
    float f = fbm4(cuv);
    float coverage = smoothstep(
      1.0 - uCloudCover * 0.9,
      1.05 - uCloudCover * 0.6,
      f
    );
    cloudA = coverage * smoothstep(0.02, 0.12, rd.y);
    vec3 cloudCol = mix(
      uCloudColorHorizon,
      uCloudColorZenith,
      clamp(rd.y * 1.5, 0.0, 1.0)
    );
    col = mix(col, cloudCol, cloudA * 0.85);
  }

  // HDR disc feeds the bloom pass on desktop; the analytic glow stands in
  // for bloom on mobile. uSunColor already carries sunset transmittance and
  // goes to zero once the sun is under the horizon.
  float cosSun = dot(rd, uSunDir);
  float disc = smoothstep(cos(0.010), cos(0.008), cosSun);
  float glow = pow(max(cosSun, 0.0), 350.0);
  float sunOcclusion = (1.0 - cloudA) * (1.0 - uCloudCover * 0.85);
  col +=
    uSunColor *
    (disc * uSunDiscIntensity + glow * uSunGlowIntensity) *
    sunOcclusion;

  // lut.a (view transmittance) fades stars near the thick horizon.
  if (uNightFactor > 0.001) {
    col +=
      vec3(stars(rd, uTime)) * uNightFactor * lut.a * (1.0 - cloudA) * 1.5;
  }

  // Below the horizon the street/buildings cover nearly everything; fade to
  // a ground tone rather than showing the integral's dark band.
  col = mix(uGroundColor, col, smoothstep(-0.06, 0.0, rd.y));

  col += vec3((ign(gl_FragCoord.xy) - 0.5) * (1.0 / 128.0));

  gl_FragColor = vec4(col, 1.0);
}
