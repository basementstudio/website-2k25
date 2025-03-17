in vec3 position;
in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uRenderCount;

out vec2 vUv;
out vec3 vWorldPosition;

void main() {
  vUv = uv;
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPosition, 1.0);
}
