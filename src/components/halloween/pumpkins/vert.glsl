attribute float aPart;
attribute float aPumpkin;
attribute float aFace;
attribute vec3 aTint;
uniform float uHover[PUMPKIN_COUNT];
varying float vAwake;
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vPart;
varying float vFace;
varying vec3 vTint;

void main() {
  vLocal = position;
  vAwake = uHover[int(aPumpkin)];
  vPart = aPart;
  vFace = aFace;
  vTint = aTint;
  mat4 model = modelMatrix * instanceMatrix;
  vec4 world = model * vec4(position, 1.0);
  vec3 scaleSquared = vec3(
    dot(model[0].xyz, model[0].xyz),
    dot(model[1].xyz, model[1].xyz),
    dot(model[2].xyz, model[2].xyz)
  );
  vNormal = normalize(mat3(model) * (normal / scaleSquared));
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
