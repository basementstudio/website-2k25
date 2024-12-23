precision highp float;

uniform sampler2D uMainTexture;
uniform vec2 screenSize;
uniform float dpr;
uniform float aspect;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(uMainTexture, vUv);

  // Convert to grayscale using luminance values
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  gl_FragColor = vec4(vec3(gray), color.a);
}
