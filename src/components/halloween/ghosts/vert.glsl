uniform float uTime;
uniform float uSeed;

varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = position;
  // 0 at the top of the head, 1 at the hem: how loose the sheet is there.
  float loose = pow(clamp(1.0 - p.y, 0.0, 1.0), 2.0);
  float angle = atan(p.z, p.x);
  float t = uTime + uSeed * 10.0;

  // Rippling hem, and a tail that lags behind the sway of the head.
  p.xz *= 1.0 + sin(angle * 6.0 + t * 3.0) * 0.1 * loose;
  p.y += sin(angle * 5.0 - t * 2.5) * 0.06 * loose;
  p.x += sin(t * 1.3 + p.y * 2.0) * 0.06 * loose;
  p.z -= loose * 0.12;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vLocal = position;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
