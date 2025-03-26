in vec3 position;
in vec2 uv;

uniform sampler2D uFeedbackTexture;

out vec2 vUv;
out vec2 vFlowSize;
out vec2 dxy;

void main() {
  vUv = uv;
  ivec2 flowSize = textureSize(uFeedbackTexture, 0);
  vFlowSize = vec2(float(flowSize.x), float(flowSize.y));
  vec2 dxy = vec2(1.0 / vFlowSize.x, 1.0 / vFlowSize.y);
  gl_Position = vec4(position, 1.0);
}
