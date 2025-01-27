uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform vec3 uBallPosition;
uniform float uBallInfluence;
uniform float uScoreAnimation;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normal;

    // make net's top more stable
    float topStability = smoothstep(0.75, 0.0, position.y);

    // TODO: this is not too evident
    float ropeEffect = (1.0 - position.y) * (1.0 - position.y);
    float bottomPointEffect = step(0.1, position.y) * (1.0 - step(0.2, position.y));
    float pointMovement = sin(uTime * uWaveSpeed * 1.5 + position.x * 10.0) * 0.02 * bottomPointEffect;

    // Calculate distance to ball for physics interaction
    float distToBall = length(position - uBallPosition);
    float ballEffect = max(0.0, 1.0 - distToBall * 0.5) * uBallInfluence * topStability;

    float scoreAmplitude = uWaveAmplitude * (1.0 + uScoreAnimation * 5.0);

    float yWave = sin(position.y * uWaveFrequency + uTime * uWaveSpeed) * scoreAmplitude;
    float xWave = cos(position.x * uWaveFrequency * 2.0 + uTime * uWaveSpeed * 0.7) * scoreAmplitude * 0.3;
    float zWave = sin(position.z * uWaveFrequency * 2.0 + uTime * uWaveSpeed * 0.9) * scoreAmplitude * 0.3;

    float twist = sin(position.y * 8.0 + uTime * uWaveSpeed * 0.5) * ropeEffect * 0.02;
    float wave = (yWave + xWave + zWave) * topStability;

    // score wave
    float scoreWaveBase = sin(distToBall * 6.0 - uTime * 12.0);
    float scoreWaveRipple = cos(position.y * 8.0 - uTime * 8.0) * (1.0 - position.y);
    float bottomFocus = (1.0 - position.y) * (1.0 - position.y) * 1.2;
    float scoreWave = (scoreWaveBase + scoreWaveRipple) * uScoreAnimation * 0.15 * bottomFocus;

    // Extra score effect for bottom points
    float pointScoreEffect = bottomPointEffect * uScoreAnimation * 0.2 * sin(uTime * 20.0 + position.x * 5.0);

    float totalEffect = wave + ballEffect + scoreWave;

    // Create rope-like circular motion at the bottom
    float circularMotion = ropeEffect * 0.012 * sin(uTime * uWaveSpeed + position.y * 10.0);

    // Add slight outward push during score animation (more pronounced at bottom)
    float outwardPush = uScoreAnimation * 0.08 * bottomFocus * sin(position.y * 4.0);

    vec3 newPosition = position + vec3(totalEffect * cos(position.z) + twist + circularMotion * cos(position.y * 4.0) + outwardPush + pointMovement, -ballEffect * 1.5 - scoreWave * 2.0 - ropeEffect * 0.02 - pointScoreEffect, totalEffect * sin(position.x) + twist + circularMotion * sin(position.y * 4.0) + outwardPush + pointMovement);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}