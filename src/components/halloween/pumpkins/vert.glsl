varying vec3 vLocal;
varying vec3 vNormalW;

void main() {
  vec3 p = position;
  vLocal = position;
  // Vertical ribs, deepest at the equator so the poles stay smooth.
  float ribs = 1.0 + 0.07 * cos(atan(p.z, p.x) * 10.0) * (1.0 - abs(p.y));
  p.xz *= ribs;
  // Squash into pumpkin proportions and dimple the top.
  p.y *= 0.82;
  p.y -= smoothstep(0.85, 1.0, position.y) * 0.12;

  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
