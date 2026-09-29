#define PI (3.14159265359)

attribute float aLeg;
attribute vec3 aHip;
attribute float aWeight;
// Per spider: gait phase (advances with distance walked) and a 0..1 seed.
attribute float aPhase;
attribute float aSeed;

uniform float uStride;
uniform float uLift;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vPart;

mat2 rotate2d(float a) {
  float s = sin(a),
    c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec3 p = position;
  vec3 n = normal;

  if (aLeg >= 0.0) {
    // Alternating tetrapod gait: L1 R2 L3 R4 step together, then the rest.
    float group = mod(mod(aLeg, 4.0) + step(4.0, aLeg), 2.0);
    float t = aPhase + group * PI;
    // Swing around the hip's vertical axis; the foot lifts while the leg
    // swings forward (d/dt sin > 0) and is planted on the way back.
    mat2 swing = rotate2d(sin(t) * uStride);
    p.xz = aHip.xz + swing * (p.xz - aHip.xz);
    n.xz = swing * n.xz;
    p.y += max(0.0, cos(t)) * uLift * aWeight;
  } else {
    // Body bob, once per step.
    p.y += abs(sin(aPhase)) * 0.025;
  }

  mat4 model = modelMatrix * instanceMatrix;
  vec4 world = model * vec4(p, 1.0);
  vNormal = normalize(mat3(model) * n);
  vViewDir = normalize(cameraPosition - world.xyz);
  vPart = aLeg;
  gl_Position = projectionMatrix * viewMatrix * world;
}
