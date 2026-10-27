attribute vec3 aStart;
attribute vec3 aEnd;
attribute vec2 aSway;
attribute vec2 aCorner;
attribute vec3 aWebNormal;
attribute float aWeb;

uniform float uTime;
uniform float uWind;
uniform float uPluck[MAX_WEBS];
uniform float uWebOpacity[MAX_WEBS];
// Thread thickness in world units, and the target's size in pixels.
uniform float uThickness;
// Real silk is far thinner than a pixel from across the room; fading it by
// true coverage would erase it, so stop fading here.
uniform float uMinCoverage;
uniform vec2 uResolution;

varying vec3 vTangent;
varying vec3 vViewDir;
varying float vAcross;
varying float vHalfWidth;
varying float vCoverage;
varying float vOpacity;

// The web billows along its normal: slow gusts, a faster shiver on top, and
// a sharp ring-down when the cursor plucks it.
vec3 sway(vec3 p, float amount) {
  float seed = fract(aWeb * 0.618);
  float gust = 0.4 + 0.6 * (sin(uTime * 0.6 + seed * 6.28) * 0.5 + 0.5);
  float shiver =
    sin(uTime * 1.9 + seed * 12.0 + dot(p, vec3(2.3, 1.7, 2.9))) * 0.6 +
    sin(uTime * 3.7 + seed * 5.0 + dot(p, vec3(-1.3, 2.1, 0.7))) * 0.4;
  int web = int(aWeb + 0.5);
  return aWebNormal * amount * (uWind * gust * shiver + uPluck[web]);
}

void main() {
  vOpacity = uWebOpacity[int(aWeb + 0.5)];
  vec3 a = aStart + sway(aStart, aSway.x);
  vec3 b = aEnd + sway(aEnd, aSway.y);

  mat4 viewProjection = projectionMatrix * viewMatrix;
  vec4 clipA = viewProjection * vec4(a, 1.0);
  vec4 clipB = viewProjection * vec4(b, 1.0);
  vec4 clip = aCorner.x < 0.5 ? clipA : clipB;

  // Expand sideways in screen space so a thread never drops below a pixel
  // (it'd shimmer in and out); threads thinner than that fade instead.
  vec2 screenA = clipA.xy / clipA.w * uResolution;
  vec2 screenB = clipB.xy / clipB.w * uResolution;
  vec2 direction = normalize(screenB - screenA + vec2(1e-5, 0.0));
  vec2 side = vec2(-direction.y, direction.x);
  float pixels =
    uThickness * sqrt(vOpacity) * projectionMatrix[1][1] * uResolution.y * 0.5 / clip.w;
  // +1px of fringe for the antialiasing falloff in the fragment shader.
  float width = max(pixels, 1.0) + 1.0;
  clip.xy += side * aCorner.y * width / uResolution * clip.w;

  vec3 world = aCorner.x < 0.5 ? a : b;
  vTangent = normalize(b - a);
  vViewDir = normalize(cameraPosition - world);
  vAcross = aCorner.y * width * 0.5;
  vHalfWidth = width * 0.5;
  vCoverage = clamp(pixels, uMinCoverage, 1.0);
  gl_Position = clip;
}
