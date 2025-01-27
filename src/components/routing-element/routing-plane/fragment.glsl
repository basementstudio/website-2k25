varying vec2 vUv;
uniform float thickness;
uniform vec2 planeSize;

void main() {
  vec2 uv = vUv;
  vec2 pixelSize = fwidth(uv);
  float borderWidth = 2.0;
  vec2 padding = vec2(0.0, 0.0);
  vec2 paddedUV = (uv - padding) / (1.0 - 2.0 * padding);

  float aspectRatio = pixelSize.y / pixelSize.x;
  vec2 adjustedUV = vec2(paddedUV.x, paddedUV.y * aspectRatio);
  vec2 adjustedPixelSize = vec2(pixelSize.x, pixelSize.y * aspectRatio);

  float edge = 0.0;
  if (
    paddedUV.x >= 0.0 &&
    paddedUV.x <= 1.0 &&
    paddedUV.y >= 0.0 &&
    paddedUV.y <= 1.0
  ) {
    edge =
      step(paddedUV.x, borderWidth * pixelSize.x) +
      step(1.0 - borderWidth * pixelSize.x, paddedUV.x) +
      step(paddedUV.y, borderWidth * pixelSize.y) +
      step(1.0 - borderWidth * pixelSize.y, paddedUV.y);
  }

  // discard if not on border
  if (edge < 0.5) {
    discard;
  }

  vec3 color = vec3(1.0);
  gl_FragColor = vec4(color, 0.05);
}
