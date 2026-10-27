attribute float aPart;
uniform float uPumpkinScale;
uniform vec3 uTint;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vPart;
varying float vAwake;
varying float vFace;
varying vec3 vTint;

void main() {
  // Restore the decoration's coordinates for the carved face, while the
  // playable mesh stays centered on the original ball's rigid body.
  vLocal = position / uPumpkinScale + vec3(0.0, 0.47, 0.0);
  vPart = aPart;
  vAwake = 0.0;
  vFace = 0.0;
  vTint = uTint;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
