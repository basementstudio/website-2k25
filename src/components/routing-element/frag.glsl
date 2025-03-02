varying vec2 vUv;
varying vec4 vPos;
uniform vec2 resolution;

void main() {
  // add border
  float borderThickness = 1.3;

  vec2 dwdx = dFdx(vUv);
  vec2 dwdy = dFdy(vUv);
  float pixelWidth = sqrt(dwdx.x * dwdx.x + dwdy.x * dwdy.x);
  float pixelHeight = sqrt(dwdx.y * dwdx.y + dwdy.y * dwdy.y);

  vec2 uvBorderSize = vec2(
    borderThickness * pixelWidth,
    borderThickness * pixelHeight
  );

  vec2 distFromEdge = min(vUv, 1.0 - vUv);

  bool isBorder =
    distFromEdge.x < uvBorderSize.x || distFromEdge.y < uvBorderSize.y;

  // add diagonals
  vec2 vCoords = vPos.xy;
  vCoords /= vPos.w;
  vCoords = vCoords * 0.5 + 0.5;

  float aspectRatio = resolution.x / resolution.y;
  vCoords.x *= aspectRatio;

  float lineSpacing = 0.006;
  float lineWidth = 0.15;
  float lineOpacity = 0.15;

  float diagonal = (vCoords.x - vCoords.y) / (lineSpacing * sqrt(2.0));
  float pattern = abs(fract(diagonal) - 0.5) * 2.0;
  float line = smoothstep(1.0 - lineWidth, 1.0, 1.0 - pattern);

  if (isBorder) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.2); // White color for border
  } else {
    gl_FragColor = vec4(vec3(1.0), line * lineOpacity); // Diagonal pattern inside
  }
}
