#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;
uniform float uGameTime;
uniform vec2 uResolution;
uniform bool uIsTimerLow;
uniform float uIsScore;
uniform float uIsActive;

varying vec2 vUv;

// Segment rendering function
float segment(vec2 uv, bool on) {
  // Segment dimensions
  float thickness = 0.1;
  float segLength = 0.4;

  // Basic segment shape with smoother edges
  float seg =
    (1.0 - smoothstep(thickness, thickness + 0.02, abs(uv.x))) *
    (1.0 - smoothstep(segLength, segLength + 0.02, abs(uv.y) + abs(uv.x)));

  // Enhanced LED effect
  if (on) {
    // Brighter core with tighter falloff
    float core = smoothstep(0.15, 0.0, length(uv * vec2(2.5, 0.8)));
    // Tighter, more intense glow
    float glow = smoothstep(0.6, 0.0, length(uv * vec2(2.0, 0.7)));

    seg = mix(seg * glow * 0.7, seg * core, core) * 1.2;

    // Add pulsing effect when timer is low (only for timer, not score)
    if (uIsTimerLow && uIsScore < 0.5 && uIsActive > 0.5) {
      float pulse = 0.9 + 0.1 * sin(uTime * 4.0);
      seg *= pulse;
      // Add extra glow during pulse
      seg += glow * 0.35 * pulse;
    }
  } else {
    // Even dimmer unlit segments
    seg *= uIsActive > 0.5 ? 0.04 : 0.02;
  }

  return seg;
}

// Render a full 7-segment digit
float sevenSegment(vec2 uv, float num) {
  float seg = 0.0;

  // Horizontal segments
  seg += segment(uv.yx + vec2(-1.0, 0.0), num != 1.0 && num != 4.0); // Top
  seg += segment(
    uv.yx + vec2(0.0, 0.0),
    num != 0.0 && num != 1.0 && num != 7.0
  ); // Middle
  seg += segment(
    uv.yx + vec2(1.0, 0.0),
    num != 1.0 && num != 4.0 && num != 7.0
  ); // Bottom

  // Vertical segments
  seg += segment(
    uv.xy + vec2(-0.5, -0.5),
    num != 1.0 && num != 2.0 && num != 3.0 && num != 7.0
  ); // Top Left
  seg += segment(uv.xy + vec2(0.5, -0.5), num != 5.0 && num != 6.0); // Top Right
  seg += segment(
    uv.xy + vec2(-0.5, 0.5),
    num == 0.0 || num == 2.0 || num == 6.0 || num == 8.0
  ); // Bottom Left
  seg += segment(uv.xy + vec2(0.5, 0.5), num != 2.0); // Bottom Right

  return seg;
}

// Display colon separator
float displayColon(vec2 uv) {
  float dots = 0.0;
  vec2 dotUV = uv;

  // Enhanced dot rendering
  float dotSize = 0.08;
  float glowSize = 0.12;

  // Top dot
  dotUV.y -= 0.3;
  float topDot = 1.0 - smoothstep(dotSize, dotSize + 0.02, length(dotUV));
  float topGlow =
    (1.0 - smoothstep(glowSize, glowSize + 0.04, length(dotUV))) * 0.5;
  dots += topDot + topGlow;

  // Bottom dot
  dotUV.y += 0.6;
  float bottomDot = 1.0 - smoothstep(dotSize, dotSize + 0.02, length(dotUV));
  float bottomGlow =
    (1.0 - smoothstep(glowSize, glowSize + 0.04, length(dotUV))) * 0.5;
  dots += bottomDot + bottomGlow;

  // Dim the dots when inactive
  if (uIsActive < 0.5) {
    dots *= 0.05;
  }

  return dots;
}

// Display a two-digit number
float displayNumber(vec2 uv, float number, bool leadingZero) {
  float seg = 0.0;

  // Split into digits
  float tens = floor(number / 10.0);
  float ones = mod(number, 10.0);

  // Display tens digit (if non-zero or leadingZero is true)
  if (uv.x > 0.0) {
    if (tens > 0.0 || leadingZero) {
      seg += sevenSegment(uv + vec2(-0.8, 0.0), tens);
    }
  } else {
    seg += sevenSegment(uv + vec2(0.8, 0.0), ones);
  }

  return seg;
}

void main() {
  // Center and scale UV coordinates
  vec2 uv = (vUv - 0.5) * 2.0;
  uv.x *= uResolution.x / uResolution.y;

  // Scale for display size
  uv *= 3.0;

  float display = 0.0;

  // Add background shape - doubled size
  float backgroundWidth = 2.4; // Doubled from 1.2
  float backgroundHeight = 1.4; // Doubled from 0.7
  float backgroundEdgeSmooth = 0.05;
  float background =
    (1.0 -
      smoothstep(
        backgroundWidth - backgroundEdgeSmooth,
        backgroundWidth,
        abs(uv.x)
      )) *
    (1.0 -
      smoothstep(
        backgroundHeight - backgroundEdgeSmooth,
        backgroundHeight,
        abs(uv.y)
      ));

  if (uIsScore < 0.5) {
    // Timer display
    float timeInSeconds = floor(uGameTime);
    vec2 timerUV = uv;
    display += displayNumber(timerUV, timeInSeconds, true);
  } else {
    // Score display - just show the number
    display += displayNumber(uv, uGameTime, false);
  }

  // Color output with enhanced glow
  vec3 baseColor;
  vec3 glowColor;

  if (uIsScore < 0.5) {
    // Timer colors - more vibrant red with intense glow
    baseColor = vec3(1.0, 0.02, 0.02); // Even more pure red
    glowColor = vec3(1.0, 0.12, 0.08); // Adjusted red glow
  } else {
    // Score colors - more vibrant green with intense glow
    baseColor = vec3(0.02, 1.0, 0.02); // Even more pure green
    glowColor = vec3(0.15, 1.0, 0.15); // Adjusted green glow
  }

  // Dim colors when inactive
  if (uIsActive < 0.5) {
    baseColor *= 0.25; // More dimmed
    glowColor *= 0.15; // More dimmed
  }

  // Enhanced bloom effect with better color mixing
  float glowStr = smoothstep(0.1, 0.8, display);
  vec3 finalColor = mix(baseColor, glowColor, glowStr * 0.6);
  finalColor *= display * 1.8; // Further increased brightness boost

  // Mix background color (deep black) with display color
  vec3 backgroundColor = vec3(0.0, 0.0, 0.0);
  float alpha = max(background * 0.98, display > 0.0 ? 1.0 : 0.0);

  // Improved color blending with sharper transition
  finalColor = mix(backgroundColor, finalColor, smoothstep(0.0, 0.04, display));

  gl_FragColor = vec4(finalColor, alpha);
}
