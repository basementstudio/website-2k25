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

    float distToBall = length(position - uBallPosition);
    float ballEffect = max(0.0, 1.0 - distToBall * 0.5) * uBallInfluence;

    float scoreAmplitude = uWaveAmplitude * (1.0 + uScoreAnimation * 5.0);
    float wave = sin(position.y * uWaveFrequency + uTime * uWaveSpeed) * scoreAmplitude;

    float scoreWave = sin(distToBall * 8.0 - uTime * 15.0) * uScoreAnimation * 0.1;

    float yFactor = smoothstep(1.0, 0.0, position.y);
    float totalEffect = wave + ballEffect + scoreWave;

    vec3 newPosition = position + vec3(totalEffect * yFactor * cos(position.z), -ballEffect * yFactor - scoreWave * 2.0, // Enhanced downward pull during score
    totalEffect * yFactor * sin(position.x));

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}