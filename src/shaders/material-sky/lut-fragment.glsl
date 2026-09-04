precision highp float;

// Sky-view LUT: single-scattering atmosphere (Rayleigh + Mie + ozone)
// integrated over (azimuth, elevation). Runs only when the sun or weather
// moves, so the step counts can be generous. RGB holds HDR in-scattered
// radiance (the composite pass tone-maps), A holds mean view transmittance
// (the display pass gates stars with it).

varying vec2 vUv;

uniform vec3 uSunDir;
uniform float uSunIntensity;
uniform float uCloudCover;
uniform float uRainFactor;
uniform float uNightFactor;
uniform vec3 uNightAmbient;

const float PI = 3.141592653589793;

// Kilometers. Ground and atmosphere-top radii, scale heights.
const float RG = 6371.0;
const float RT = 6471.0;
const float HR = 8.0;
const float HM = 1.2;

// Scattering/absorption coefficients per km.
const vec3 BETA_R = vec3(0.0058, 0.0135, 0.0331);
const float BETA_M = 0.003;
const float BETA_M_EXT = 0.00333;
const vec3 BETA_O = vec3(0.00065, 0.00188, 0.00008);
const float MIE_G = 0.78;

const int STEPS_VIEW = 32;
const int STEPS_LIGHT = 8;

// Entry/exit distances along rd for a sphere at the origin; x > y on miss.
vec2 raySphere(vec3 ro, vec3 rd, float radius) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - radius * radius;
  float d = b * b - c;
  if (d < 0.0) return vec2(1.0, -1.0);
  float sq = sqrt(d);
  return vec2(-b - sq, -b + sq);
}

// Ozone concentrates in a band around 25km.
float ozoneDensity(float h) {
  return max(0.0, 1.0 - abs(h - 25.0) / 15.0);
}

void main() {
  // Inverse of the display pass mapping: u is azimuth around +y from +z,
  // v is horizon-dense (sqrt) elevation.
  float az = vUv.x * 2.0 * PI;
  float t = vUv.y * 2.0 - 1.0;
  float el = sign(t) * t * t * 0.5 * PI;
  vec3 rd = vec3(cos(el) * sin(az), sin(el), cos(el) * cos(az));

  vec3 ro = vec3(0.0, RG + 0.2, 0.0);

  vec2 atm = raySphere(ro, rd, RT);
  float tMax = max(atm.y, 0.0);
  vec2 gnd = raySphere(ro, rd, RG);
  if (gnd.x > 0.0) tMax = gnd.x;

  float ds = tMax / float(STEPS_VIEW);

  float odR = 0.0;
  float odM = 0.0;
  float odO = 0.0;
  vec3 sumR = vec3(0.0);
  vec3 sumM = vec3(0.0);

  for (int i = 0; i < STEPS_VIEW; i++) {
    vec3 p = ro + rd * ((float(i) + 0.5) * ds);
    float h = length(p) - RG;
    float dR = exp(-h / HR);
    float dM = exp(-h / HM);
    float dO = ozoneDensity(h);
    odR += dR * ds;
    odM += dM * ds;
    odO += dO * ds;

    // Sun ray blocked by the planet -> no in-scatter from this sample.
    vec2 lgnd = raySphere(p, uSunDir, RG);
    if (lgnd.x > 0.0) continue;

    vec2 latm = raySphere(p, uSunDir, RT);
    float lds = max(latm.y, 0.0) / float(STEPS_LIGHT);
    float lodR = 0.0;
    float lodM = 0.0;
    float lodO = 0.0;
    for (int j = 0; j < STEPS_LIGHT; j++) {
      vec3 lp = p + uSunDir * ((float(j) + 0.5) * lds);
      float lh = length(lp) - RG;
      lodR += exp(-lh / HR) * lds;
      lodM += exp(-lh / HM) * lds;
      lodO += ozoneDensity(lh) * lds;
    }

    vec3 tau =
      BETA_R * (odR + lodR) +
      vec3(BETA_M_EXT) * (odM + lodM) +
      BETA_O * (odO + lodO);
    vec3 attn = exp(-tau);
    sumR += attn * dR * ds;
    sumM += attn * dM * ds;
  }

  float mu = dot(rd, uSunDir);
  float pR = 3.0 / (16.0 * PI) * (1.0 + mu * mu);
  float g2 = MIE_G * MIE_G;
  // Cornette-Shanks Mie phase.
  float pM =
    3.0 /
    (8.0 * PI) *
    ((1.0 - g2) * (1.0 + mu * mu)) /
    ((2.0 + g2) * pow(1.0 + g2 - 2.0 * MIE_G * mu, 1.5));

  vec3 col = uSunIntensity * (sumR * BETA_R * pR + sumM * vec3(BETA_M) * pM);

  // Faint floor so the night sky reads deep blue instead of void.
  col += uNightAmbient * uNightFactor * (0.6 + 0.4 * max(rd.y, 0.0));

  // Overcast flattens toward gray; rain darkens the whole dome further.
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(luma) * 0.8, uCloudCover * 0.7);
  col *= mix(1.0, 0.5, uRainFactor);

  vec3 tView = exp(
    -(BETA_R * odR + vec3(BETA_M_EXT) * odM + BETA_O * odO)
  );
  gl_FragColor = vec4(col, dot(tView, vec3(1.0 / 3.0)));
}
