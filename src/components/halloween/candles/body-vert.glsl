attribute float aLit;
attribute float aSeed;
attribute vec3 aWaxTint;
varying float vLit;
varying vec3 vColor;
varying vec3 vNormal;
varying float vHeight;

void main() {
  float wax = step(0.25, color.r);
  vColor = color * mix(vec3(1.0), aWaxTint, wax);
  vLit = aLit;
  vec3 p = position;
  float angle = atan(p.z, p.x);
  p.xz *= 1.0 + sin(angle * 3.0 + aSeed * 12.0) * 0.035 * wax;
  p.y -=
    (0.5 + 0.5 * sin(angle * 2.0 + aSeed * 17.0)) *
    0.045 *
    smoothstep(0.6, 0.95, position.y) *
    wax;
  // Inverse instance scale keeps the normal correct on tall, thin pillars.
  vec3 scaleSquared = vec3(
    dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz),
    dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz),
    dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz)
  );
  vNormal = normalize(
    mat3(modelMatrix) * mat3(instanceMatrix) * (normal / scaleSquared)
  );
  vHeight = position.y;
  gl_Position =
    projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}
