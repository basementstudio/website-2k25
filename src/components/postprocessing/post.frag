precision mediump float;

uniform sampler2D uMainTexture;
uniform bool uDisablePostprocessing;
uniform float aspect;
uniform vec2 screenSize;
uniform float dpr;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec4 color = texture2D(uMainTexture, uv);

    gl_FragColor = color;
}
