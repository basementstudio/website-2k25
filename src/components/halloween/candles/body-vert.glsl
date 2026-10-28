varying vec3 vColor;
varying vec3 vNormal;
varying float vHeight;

void main() {
  vColor = color;
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
    projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
