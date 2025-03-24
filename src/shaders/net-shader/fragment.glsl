uniform sampler2D map;
uniform float uTime;
uniform float uScoreAnimation;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Sample the texture with animated UVs
  vec4 texColor = texture2D(map, vUv);

  // Add a subtle pulsing glow during scoring
  float glowIntensity = 1.0 + uScoreAnimation * 0.5;

  // Preserve the texture's alpha for transparency
  gl_FragColor = vec4(texColor.rgb * glowIntensity, texColor.a);
}
