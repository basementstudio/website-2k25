uniform sampler2D map;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec4 texColor = texture2D(map, vUv);
    vec4 white = vec4(2.0, 2.0, 2.0, 2.0);

    gl_FragColor = white;
}