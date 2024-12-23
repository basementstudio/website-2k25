precision highp float;

uniform sampler2D uMainTexture;
uniform vec2 screenSize;
uniform float dpr;
uniform float aspect;
uniform float uTime;

varying vec2 vUv;

// Simple noise function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Simplified scanline effect with increased intensity
float scanlines(vec2 uv) {
  float scanline = sin(uv.y * 800.0 + uTime * 10.0) * 0.5 + 0.5;
  return mix(1.0, scanline, 0.15);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv *= 0.76;

  // Existing fisheye effect
  float uFisheyeStrength = 0.45;
  float d = length(uv);
  float z = sqrt(1.0 - d * d * uFisheyeStrength);
  vec2 distortedUv = uv * (z / (1.0 - d * d * uFisheyeStrength));
  distortedUv = distortedUv * 0.5 + 0.5;
  distortedUv = clamp(distortedUv, 0.0, 1.0);

  // Get base color
  vec4 color = texture2D(uMainTexture, distortedUv);

  // Convert to grayscale and lower exposure
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114)) * 0.7;

  // Increase contrast by making shadows darker
  gray = pow(gray, 1.2);

  // Add vignette effect
  float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv));
  gray *= vignette * 0.6 + 0.2;

  // Add scanlines
  gray *= scanlines(vUv);

  // Add subtle noise
  float noise = random(vUv + uTime * 0.1) * 0.1;
  gray += noise;

  gl_FragColor = vec4(vec3(gray), color.a);
}
