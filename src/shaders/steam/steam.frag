uniform sampler2D uNoise;
uniform float uTime;

varying vec2 vUv;

void main() {
    vec2 steamUv = vUv;
    steamUv.x *= 0.5;
    steamUv.y *= 0.3;
    steamUv.y -= uTime * 0.02;

    float steam = texture(uNoise, steamUv).r;
    steam = smoothstep(0.45, 1.0, steam);

    // fade edges
    steam *= smoothstep(0.0, 0.15, vUv.x);
    steam *= 1.0 - smoothstep(0.85, 1.0, vUv.x);
    steam *= smoothstep(0.0, 0.15, vUv.y);
    steam *= 1.0 - smoothstep(0.85, 1.0, vUv.y);

    float pixelRatio = 1.0;
    float checkerSize = 2.0 * pixelRatio;
    vec2 checkerPos = floor(gl_FragCoord.xy / checkerSize);
    float checkerPattern = mod(checkerPos.x + checkerPos.y, 2.0);

    vec3 baseColor = vec3(0.92, 0.78, 0.62);

    float alpha = steam * (checkerPattern > 0.5 ? 1.0 : 0.0);
    vec4 color = vec4(baseColor, alpha);

    gl_FragColor = color;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}