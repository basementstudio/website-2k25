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

const float DAMPING = 0.92;
const float SPRING_K = 0.4;
const float REST_LENGTH = 0.08;
const vec3 GRAVITY = vec3(0.0, -12.0, 0.0);
const float AIR_RESISTANCE = 0.03;
const float TOP_FIXED_THRESHOLD = -0.15;

vec3 enforceDistanceConstraint(vec3 p, vec3 neighbor, float restLength, float strength) {
    vec3 delta = neighbor - p;
    float dist = length(delta);
    if(dist > 0.0) {
        float correction = (dist - restLength) / dist;
        vec3 dirBias = vec3(1.2, 1.0, 1.2);
        return p + strength * correction * delta * dirBias;
    }
    return p;
}

void main() {
    vUv = uv;
    vNormal = normal;
    vPosition = position;

    float verticalFreedom = position.z < TOP_FIXED_THRESHOLD ? 0.0 : 1.0;

    if(position.z < TOP_FIXED_THRESHOLD) {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        return;
    }

    float prevTime = uTime - uDeltaTime;
    vec3 prevPos = position + vec3(sin(prevTime * uWaveSpeed + position.x) * 0.02, cos(prevTime * uWaveSpeed + position.y) * 0.01, sin(prevTime * uWaveSpeed + position.z) * 0.02) * verticalFreedom;

    vec3 currentPos = position;
    float distToBall = length(position - uBallPosition);
    vec3 springForce = normalize(uBallPosition - position) * SPRING_K * max(0.0, distToBall - REST_LENGTH) * uBallInfluence;

    currentPos = enforceDistanceConstraint(currentPos, currentPos + vec3(REST_LENGTH, 0.0, 0.0), REST_LENGTH, 0.7);
    currentPos = enforceDistanceConstraint(currentPos, currentPos + vec3(0.0, REST_LENGTH, 0.0), REST_LENGTH, 0.5);
    currentPos = enforceDistanceConstraint(currentPos, currentPos + vec3(0.0, 0.0, REST_LENGTH), REST_LENGTH, 0.7);

    vec3 rotationalForce = vec3(sin(uTime * 2.0 + position.y * 4.0) * 0.2, 0.0, cos(uTime * 2.0 + position.y * 4.0) * 0.2);

    vec3 velocity = (currentPos - prevPos) * (1.0 - AIR_RESISTANCE);
    vec3 acceleration = GRAVITY + springForce + rotationalForce;
    vec3 newPos = currentPos + (DAMPING * velocity) + acceleration * uDeltaTime * uDeltaTime;

    float wave = sin(position.y * uWaveFrequency + uTime * uWaveSpeed) * uWaveAmplitude;
    float scoreWave = sin(distToBall * 6.0 - uTime * 12.0) * uScoreAnimation * 0.2;

    vec3 finalPos = mix(position, newPos + vec3(wave, 0.0, wave), verticalFreedom);
    finalPos += vec3(scoreWave) * verticalFreedom;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}