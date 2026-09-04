precision highp float;

varying vec3 vWorldPosition;

void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  // Pin to the far plane so, drawn after the opaques, early-z discards every
  // occluded fragment — the sky only pays for pixels it actually fills.
  gl_Position.z = gl_Position.w;
}
