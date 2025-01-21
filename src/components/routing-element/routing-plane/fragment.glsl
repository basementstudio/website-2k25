varying vec2 vUv;
uniform float thickness;
uniform vec2 planeSize;

void main() {
  vec2 uv = vUv;
  vec2 pixelSize = fwidth(uv);
  float borderWidth = 2.0;
  float worldSquareSize = 0.1;
  float plusThickness = 0.15;
  vec2 padding = vec2(0.005, 0.005);
  vec2 squareSize = worldSquareSize / planeSize * 0.5;
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

  vec2 localUV;
  float plus = 0.0;
  float borderOffset = borderWidth * pixelSize.x;

  // bottom left
  if (uv.x < squareSize.x && uv.y < squareSize.y) {
    localUV = uv / squareSize;
    if (
      abs(localUV.y - 0.5) < plusThickness * 0.5 ||
      abs(localUV.x - 0.5) < plusThickness * 0.5
    )
      plus = 1.0;
  } // bottom right
  else if (uv.x > 1.0 - squareSize.x && uv.y < squareSize.y) {
    localUV = (uv - vec2(1.0 - squareSize.x, 0.0)) / squareSize;
    if (
      abs(localUV.y - 0.5) < plusThickness * 0.5 ||
      abs(localUV.x - 0.5) < plusThickness * 0.5
    )
      plus = 1.0;
  } // top left
  else if (uv.x < squareSize.x && uv.y > 1.0 - squareSize.y) {
    localUV = (uv - vec2(0.0, 1.0 - squareSize.y)) / squareSize;
    if (
      abs(localUV.y - 0.5) < plusThickness * 0.5 ||
      abs(localUV.x - 0.5) < plusThickness * 0.5
    )
      plus = 1.0;
  } // top right
  else if (uv.x > 1.0 - squareSize.x && uv.y > 1.0 - squareSize.y) {
    localUV = (uv - vec2(1.0 - squareSize.x, 1.0 - squareSize.y)) / squareSize;
    if (
      abs(localUV.y - 0.5) < plusThickness * 0.5 ||
      abs(localUV.x - 0.5) < plusThickness * 0.5
    )
      plus = 1.0;
  }

  // discard if not on border or plus
  if (edge < 0.5 && plus < 0.5) {
    discard;
  }

  vec3 color = vec3(1.0);
  float opacity = plus > 0.5 ? 1.0 : 0.05;
  gl_FragColor = vec4(color, opacity);
}
