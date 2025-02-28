uniform float uTime;
uniform sampler2D uNoise;

varying vec2 vUv;

vec2 rotate2D(vec2 value, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    mat2 m = mat2(c, s, -s, c);
    return m * value;
}

void main() {
    vUv = uv;

    vec2 offset = vec2(texture(uNoise, vec2(0.25, uTime * 0.005)).r, 0.0);
    offset *= pow(uv.y, 1.2) * 0.035;

    vec3 newPosition = position;
    newPosition.xz += offset;

    float twist = texture(uNoise, vec2(0.5, uv.y * 0.2 - uTime * 0.005)).r;
    float angle = twist * 8.0;
    newPosition.xz = rotate2D(newPosition.xz, angle);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}