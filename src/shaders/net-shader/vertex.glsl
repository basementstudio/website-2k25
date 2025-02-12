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

const float DAMPING = 0.98;
const float SPRING_K = 0.8;
const vec3 GRAVITY = vec3(0.0, -9.81, 0.0);

void main() {
    vUv = uv;
    vNormal = normal;

    float prevTime = uTime - uDeltaTime;
    vec3 prevPos = position + vec3(sin(prevTime * uWaveSpeed + position.x) * 0.02, cos(prevTime * uWaveSpeed + position.y) * 0.02, sin(prevTime * uWaveSpeed + position.z) * 0.02);

    vec3 currentPos = position;

    // Calculate spring force (Hooke's law)
    float topStability = smoothstep(0.75, 0.0, position.y);
    float distToBall = length(position - uBallPosition);
    vec3 springForce = normalize(uBallPosition - position) * SPRING_K * max(0.0, distToBall - 1.0) * uBallInfluence;

    // Apply Verlet
    vec3 acceleration = GRAVITY * topStability + springForce;
    vec3 newPos = currentPos + (DAMPING * (currentPos - prevPos)) + acceleration * uDeltaTime * uDeltaTime;

    float ropeEffect = (1.0 - position.y) * (1.0 - position.y);
    float wave = sin(position.y * uWaveFrequency + uTime * uWaveSpeed) * uWaveAmplitude * topStability;

    float scoreWave = sin(distToBall * 6.0 - uTime * 12.0) * uScoreAnimation * 0.15 * (1.0 - position.y);

    vec3 finalPos = mix(position + vec3(wave, -ropeEffect * 0.02, wave), newPos, topStability);

    finalPos += vec3(scoreWave) * (1.0 - position.y);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}