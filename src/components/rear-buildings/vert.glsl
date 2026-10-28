varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

void main() {
  mat4 worldMatrix = modelMatrix * instanceMatrix;
  vec4 world = worldMatrix * vec4(position, 1.0);
  vWorldPosition = world.xyz;
  // The instances use axis-aligned boxes, so normalizing each scaled axis
  // gives the exact world normal without an inverse matrix per vertex.
  vWorldNormal = normalize(mat3(worldMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
