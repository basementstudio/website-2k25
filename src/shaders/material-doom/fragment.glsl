
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uCurvature;
  uniform float uScanlineIntensity;
  uniform float uScanlineCount;
  uniform float uVignette;
  uniform float uBrightness;
  uniform float uContrast;

  varying vec2 vUv;

  // CRT barrel distortion
  vec2 barrelDistortion(vec2 coord, float amt) {
    vec2 cc = coord - 0.5;
    float dist = dot(cc, cc);
    return coord + cc * dist * amt;
  }

  // Chromatic aberration
  vec3 chromaticAberration(sampler2D tex, vec2 uv, float amount) {
    float aberrationAmount = amount * 0.01;
    vec2 distFromCenter = uv - 0.5;

    vec2 aberratedUv = barrelDistortion(uv, uCurvature);

    float r = texture2D(tex, aberratedUv - distFromCenter * aberrationAmount).r;
    float g = texture2D(tex, aberratedUv).g;
    float b = texture2D(tex, aberratedUv + distFromCenter * aberrationAmount).b;

    return vec3(r, g, b);
  }

  // Scanlines
  float scanline(float uv, float resolution, float opacity) {
    float intensity = sin(uv * resolution * 3.14159265359 * 2.0);
    intensity = ((0.5 * intensity) + 0.5) * 0.9 + 0.1;
    return clamp(intensity, 0.0, 1.0) * opacity + (1.0 - opacity);
  }

  // Vignette
  float vignette(vec2 uv, float intensity) {
    vec2 vignetteUv = uv * (1.0 - uv.yx);
    float vig = vignetteUv.x * vignetteUv.y * 15.0;
    return pow(vig, intensity);
  }

  // Noise
  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // Apply barrel distortion
    vec2 distortedUv = barrelDistortion(uv, uCurvature);

    // Check if we're outside the screen bounds after distortion
    if (distortedUv.x < 0.0 || distortedUv.x > 1.0 || distortedUv.y < 0.0 || distortedUv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // Get color with chromatic aberration
    vec3 color = chromaticAberration(uTexture, uv, 1.0);

    // Apply scanlines
    float scanlineValue = scanline(distortedUv.y, uScanlineCount, uScanlineIntensity);
    color *= scanlineValue;

    // Add some flicker
    float flicker = 1.0 + sin(uTime * 6.0) * 0.01;
    color *= flicker;

    // Apply brightness and contrast
    color = (color - 0.5) * uContrast + 0.5 + uBrightness;

    // Apply vignette
    float vignetteValue = vignette(distortedUv, uVignette);
    color *= vignetteValue;

    // Add subtle noise
    float noise = random(distortedUv + uTime) * 0.03;
    color += noise;

    // Add phosphor glow effect
    vec3 phosphor = color * 1.05;
    phosphor.g *= 1.1; // Green phosphor was common in old CRTs
    color = mix(color, phosphor, 0.3);

    // Clamp values
    color = clamp(color, 0.0, 1.0);

    color = vec3(
      pow(color.x, 1.5),
      pow(color.y, 1.5),
      pow(color.z, 1.5)
    );

    gl_FragColor = vec4(color * 4., 1.0);
  }
