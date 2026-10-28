precision mediump float;

uniform float uTime;
uniform sampler2D uScreen;
// Same fade as material-global-shader: darken with the rest of the office
// while something else is inspected (inspectingFactor > 0 means the iPod
// itself is the one being inspected — Inspectable drives it on children).
uniform float fadeFactor;
uniform float inspectingFactor;
uniform vec2 uUvMin;
uniform vec2 uUvMax;
varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  // The mesh's UV island is rotated 90° in the atlas: u runs along the
  // screen's height (bottom -> top), v along its width (left -> right).
  vec2 island = (vUv - uUvMin) / (uUvMax - uUvMin);
  vec2 uv = vec2(island.y, island.x);

  // Edge-lit backlight falloff — brighter near the top-center, dimmer at
  // the edges, like an old monochrome LCD's backlight bleed.
  vec2 centered = uv - vec2(0.5, 0.6);
  float falloff = clamp(1.0 - dot(centered, centered) * 1.4, 0.0, 1.0);

  // Pale blue-gray backlight base rather than a flat plastic color.
  vec3 backlight = mix(vec3(0.6, 0.64, 0.62), vec3(0.82, 0.86, 0.84), falloff);
  // Fine horizontal + vertical pixel rows — a hint of an LCD raster grid
  // over the UI drawn below.
  // without simulating actual on-screen content.
  float row = fract(uv.y * 140.0);
  float rowLine = smoothstep(0.0, 0.15, row) * smoothstep(1.0, 0.85, row);
  backlight *= mix(0.9, 1.0, rowLine);

  float col = fract(uv.x * 90.0);
  float colLine = smoothstep(0.0, 0.2, col) * smoothstep(1.0, 0.8, col);
  backlight *= mix(0.96, 1.0, colLine);

  // Barely-perceptible backlight flicker.
  float flicker = 0.985 + 0.015 * sin(uTime * 3.1) * sin(uTime * 0.7 + 1.3);
  backlight *= flicker;

  // A whisper of static noise so it doesn't read as a flat plastic color.
  float noise = random(uv * vec2(400.0, 300.0) + uTime * 0.05);
  backlight += (noise - 0.5) * 0.015;

  // Vignette toward the screen edges.
  vec2 vignetteUv = uv * 2.0 - 1.0;
  float vignette = clamp(1.0 - dot(vignetteUv, vignetteUv) * 0.25, 0.0, 1.0);
  backlight *= vignette;

  // UI ink (screen.ts): white = backlight, black = ink. Dark LCD
  // segments with a faint soft shadow offset down-right, like the ghosting
  // on old passive-matrix screens.
  float ink = 1.0 - texture2D(uScreen, uv).r;
  float ghost = 1.0 - texture2D(uScreen, uv + vec2(-0.004, 0.005)).r;
  vec3 inkColor = vec3(0.12, 0.15, 0.16);
  vec3 color = mix(backlight, backlight * 0.82, ghost * 0.5);
  color = mix(color, inkColor, ink * 0.92);

  if (inspectingFactor <= 0.0) color *= 1.0 - fadeFactor;

  gl_FragColor = vec4(color, 1.0);
}
