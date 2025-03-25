in vec3 position;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix; 
uniform mat4 projectionMatrix;

out vec3 vWorldPosition;

void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
}
