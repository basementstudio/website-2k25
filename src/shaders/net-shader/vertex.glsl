uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform vec3 uBallPosition;
uniform float uBallInfluence;
uniform float uScoreAnimation;
uniform float uDeltaTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Enhanced physics parameters
const float DAMPING = 0.94; // Slightly increased for more sustained movement
const float SPRING_K = 0.5; // Increased spring constant for more responsive movement
const float REST_LENGTH = 0.08;
const vec3 GRAVITY = vec3(0.0, -14.0, 0.0); // Increased gravity for more dramatic movement
const float AIR_RESISTANCE = 0.025; // Reduced for more fluid movement
const float TOP_FIXED_THRESHOLD = -0.15;
const float ROTATIONAL_FORCE_MULTIPLIER = 0.3; // New parameter for enhanced swaying

vec3 enforceDistanceConstraint(
  vec3 p,
  vec3 neighbor,
  float restLength,
  float strength
) {
  vec3 delta = neighbor - p;
  float dist = length(delta);
  if (dist > 0.0) {
    float correction = (dist - restLength) / dist;
    // Enhanced directional bias for more natural movement
    vec3 dirBias = vec3(1.3, 1.0, 1.3);
    return p + strength * correction * delta * dirBias;
  }
  return p;
}

void main() {
  vUv = uv;
  vNormal = normal;
  vPosition = position;

  float verticalFreedom = position.z < TOP_FIXED_THRESHOLD ? 0.0 : 1.0;

  if (position.z < TOP_FIXED_THRESHOLD) {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    return;
  }

  float prevTime = uTime - uDeltaTime;
  // Enhanced wave motion
  vec3 prevPos =
    position +
    vec3(
      sin(prevTime * uWaveSpeed + position.x * 1.2) * 0.025,
      cos(prevTime * uWaveSpeed + position.y * 1.1) * 0.015,
      sin(prevTime * uWaveSpeed + position.z * 1.3) * 0.025
    ) *
      verticalFreedom;

  vec3 currentPos = position;
  float distToBall = length(position - uBallPosition);

  // Enhanced ball interaction
  float ballInfluence = uBallInfluence * (1.0 + sin(uTime * 8.0) * 0.2);
  vec3 springForce =
    normalize(uBallPosition - position) *
    SPRING_K *
    max(0.0, distToBall - REST_LENGTH) *
    ballInfluence;

  // Enhanced distance constraints
  currentPos = enforceDistanceConstraint(
    currentPos,
    currentPos + vec3(REST_LENGTH, 0.0, 0.0),
    REST_LENGTH,
    0.8
  );
  currentPos = enforceDistanceConstraint(
    currentPos,
    currentPos + vec3(0.0, REST_LENGTH, 0.0),
    REST_LENGTH,
    0.6
  );
  currentPos = enforceDistanceConstraint(
    currentPos,
    currentPos + vec3(0.0, 0.0, REST_LENGTH),
    REST_LENGTH,
    0.8
  );

  // Enhanced rotational force with varying frequencies
  vec3 rotationalForce = vec3(
    sin(uTime * 2.2 + position.y * 4.0) * ROTATIONAL_FORCE_MULTIPLIER,
    cos(uTime * 1.8) * ROTATIONAL_FORCE_MULTIPLIER * 0.5,
    cos(uTime * 2.4 + position.y * 4.0) * ROTATIONAL_FORCE_MULTIPLIER
  );

  vec3 velocity = (currentPos - prevPos) * (1.0 - AIR_RESISTANCE);
  vec3 acceleration = GRAVITY + springForce + rotationalForce;
  vec3 newPos =
    currentPos + DAMPING * velocity + acceleration * uDeltaTime * uDeltaTime;

  // Enhanced wave and score effects
  float wave =
    sin(position.y * uWaveFrequency + uTime * uWaveSpeed) * uWaveAmplitude;
  float scoreWave =
    sin(distToBall * 8.0 - uTime * 14.0) * uScoreAnimation * 0.25;

  // Add subtle secondary motion
  float secondaryWave =
    cos(position.x * 3.0 + uTime * 1.5) * 0.01 * verticalFreedom;

  vec3 finalPos = mix(
    position,
    newPos + vec3(wave + secondaryWave),
    verticalFreedom
  );
  finalPos += vec3(scoreWave) * verticalFreedom;

  // Calculate vertical position influence (more movement at bottom of net)
  float verticalInfluence = smoothstep(-0.15, 0.8, position.y);

  // Gentle swaying motion with varying frequencies
  float swayX = sin(uTime * 1.2 + position.y * 2.0) * 0.008 * verticalInfluence;
  float swayZ = cos(uTime * 1.0 + position.y * 2.0) * 0.008 * verticalInfluence;

  // Add some subtle twisting
  float twist = sin(uTime * 0.8 + position.y * 3.0) * 0.005 * verticalInfluence;
  swayX += cos(position.y * 4.0 + uTime) * twist;
  swayZ += sin(position.y * 4.0 + uTime) * twist;

  // Ball interaction effect
  float ballEffect =
    smoothstep(0.3, 0.0, distToBall) * uBallInfluence * verticalInfluence;
  vec3 toBall = normalize(position - uBallPosition);

  // Score animation effect - ripple pattern
  float scoreEffect =
    sin(uTime * 10.0 - position.y * 15.0) *
    uScoreAnimation *
    0.02 *
    verticalInfluence;

  // Combine all movements
  finalPos.x += swayX + toBall.x * ballEffect + scoreEffect;
  finalPos.y += sin(uTime * 1.5 + position.x * 2.0) * 0.003 * verticalInfluence;
  finalPos.z += swayZ + toBall.z * ballEffect + scoreEffect;

  // UV distortion for texture animation
  vec2 uvOffset =
    vec2(
      sin(uTime * 1.5 + uv.y * 4.0) * 0.005,
      cos(uTime * 1.2 + uv.x * 4.0) * 0.005
    ) *
    verticalInfluence;

  // Enhance UV distortion during scoring
  if (uScoreAnimation > 0.0) {
    uvOffset +=
      vec2(sin(uTime * 8.0 + uv.y * 10.0), cos(uTime * 8.0 + uv.x * 10.0)) *
      uScoreAnimation *
      0.01;
  }

  vUv += uvOffset;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}
