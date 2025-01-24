uniform sampler2D map;
varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(map, vUv);
    vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
    gl_FragColor = mix(white, texColor, 0.5);
}