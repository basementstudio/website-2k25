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

// Helper functions
float onOff(float a, float b, float c) {
  return step(c, sin(uTime + a * cos(uTime * b)));
}

float ramp(float y, float start, float end) {
  float inside = step(start, y) - step(end, y);
  float fact = (y - start) / (end - start) * inside;
  return (1.0 - fact) * inside;
}

// Moving stripes effect
float stripes(vec2 uv) {
  float noise = random(uv * vec2(0.5, 1.0) + vec2(1.0, 3.0)) * 0.5;
  return ramp(
    mod(uv.y * 3.0 + uTime / 3.0 + sin(uTime + sin(uTime * 0.43)), 1.0),
    0.6,
    0.7
  ) *
  noise;
}
// Simplified scanline effect
float scanlines(vec2 uv) {
  float scanline = sin(uv.y * 800.0 + uTime * 2.0) * 0.5 + 0.5;
  return mix(1.0, scanline, 0.15);
}

// Add these new functions after the existing helper functions
float fault(vec2 uv, float strength) {
  float v =
    pow(0.5 - 0.5 * cos(2.0 * 3.1415926 * uv.y), 100.0) *
    sin(2.0 * 3.1415926 * uv.y);
  return v * strength;
}

float glitchDisplacement(vec2 uv) {
  float t = uTime / 10.0;
  float r = random(vec2(t, 0.0));
  return fault(
    uv + vec2(0.0, fract(t * 2.0)),
    5.0 * sign(r) * pow(abs(r), 5.0)
  ) *
  0.1;
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv *= 0.76;

  // Shift frequency control
  float shiftFreq = 0.2;

  // Apply camera shift
  vec2 look = uv * 0.5 + 0.5;

  // Add horizontal glitch displacement
  look.x += glitchDisplacement(look);

  float window =
    1.0 /
    (1.0 +
      20.0 *
        (look.y - mod(uTime / (6.0 / shiftFreq), 1.0)) *
        (look.y - mod(uTime / (6.0 / shiftFreq), 1.0)));

  // Vertical shift
  float vShift =
    0.2 *
    onOff(2.0, 7.0 * shiftFreq, 0.95) *
    (sin(uTime * shiftFreq) * sin(uTime * 15.0 * shiftFreq) +
      (0.3 + 0.05 * sin(uTime * 150.0 * shiftFreq) * cos(uTime * shiftFreq))) *
    7.0;
  look.y = mod(look.y + vShift, 1.0);

  uv = look * 2.0 - 1.0;

  // Fisheye effect
  float uFisheyeStrength = 0.48;
  float d = length(uv);
  float z = sqrt(1.0 - d * d * uFisheyeStrength);
  vec2 distortedUv = uv * (z / (1.0 - d * d * uFisheyeStrength));
  distortedUv = distortedUv * 0.5 + 0.5;
  distortedUv = clamp(distortedUv, 0.0, 1.0);

  // Get base color
  vec4 color = texture2D(uMainTexture, distortedUv);

  // Convert to grayscale and lower exposure
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114)) * 0.7;

  // Increase contrast
  gray = pow(gray, 1.2);

  // Add vignette effect
  float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv));
  gray *= vignette * 0.6 + 0.2;

  // Add scanlines
  gray *= scanlines(vUv);

  // Add noise
  float noise = random(vUv + uTime * 0.1) * 0.1;
  gray += noise;

  // Add stripes effect
  gray += stripes(vUv) * 0.1;

  gl_FragColor = vec4(vec3(gray), color.a);
}
