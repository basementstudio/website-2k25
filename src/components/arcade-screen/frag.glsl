uniform sampler2D map;
uniform vec2 iResolution;

varying vec2 vUv;

vec3 PulseIntegral(vec3 x, float s1, float s2) {
  return clamp(x - s1, vec3(0.0), vec3(s2 - s1));
}

vec3 GetPixelMatrix(vec2 vUV) {
  vec2 dx = dFdx(vUV);
  vec2 dy = dFdy(vUV);
  float dU = length(vec2(dx.x, dy.x));
  float dV = length(vec2(dx.y, dy.y));

  vec2 vSize = vec2(0.35, 0.95);
  vec2 vMin = 0.5 - vSize * 0.5;
  vec2 vMax = 0.5 + vSize * 0.5;

  vec3 x = vec3(vUV.x);
  vec3 y = vec3(vUV.y);

  x += vec3(0.66, 0.33, 0.0);
  y += 0.5 * step(fract(x * 0.5), vec3(0.5));

  x = fract(x);
  y = fract(y);

  vec3 vResultX =
    (PulseIntegral(x + dU, vMin.x, vMax.x) -
      PulseIntegral(x - dU, vMin.x, vMax.x)) /
    min(dU, 1.0);
  vec3 vResultY =
    (PulseIntegral(y + dV, vMin.y, vMax.y) -
      PulseIntegral(y - dV, vMin.y, vMax.y)) /
    min(dV, 1.0);

  return min(vResultX, vResultY) * 5.0;
}

float GetScanline(vec2 vUV) {
  vUV.y *= 0.5;
  vec2 dx = dFdx(vUV);
  vec2 dy = dFdy(vUV);
  float dV = length(vec2(dx.y, dy.y));
  float fResult = sin(vUV.y * 12.0) * 0.35 + 0.65;
  return mix(fResult, 1.0, min(1.0, dV * 1.3));
}

void main() {
  vec2 vPixelCoord = vUv * iResolution;
  vec3 vPixelMatrix = GetPixelMatrix(vPixelCoord);
  float fScanline = GetScanline(vPixelCoord);

  vec4 color = texture2D(map, vUv);
  vec3 vResult = color.rgb * vPixelMatrix * fScanline;

  // Convert to monochrome (grayscale)
  float gray = dot(vResult, vec3(0.299, 0.587, 0.114));

  // Define orange tint color - adjusted for stronger orange
  vec3 orangeTint = vec3(1.0, 0.2, 0.0);

  // Blend grayscale with orange tint
  vResult = vec3(gray) * orangeTint;

  gl_FragColor = vec4(vResult, color.a);
}
