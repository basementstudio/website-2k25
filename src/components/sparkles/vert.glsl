uniform float pixelRatio;
uniform float time;
attribute float size;
attribute float speed;
attribute float opacity;
attribute vec3 noise;
attribute vec3 color;

varying vec3 vColor;
varying float vOpacity;
varying vec3 vWorldPosition;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Create quick jittery movement
    modelPosition.x += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
    modelPosition.y += cos(time * speed + modelPosition.y * noise.y * 100.0) * 0.2;
    modelPosition.z += cos(time * speed + modelPosition.z * noise.z * 100.0) * 0.2;

    vec4 projectionPostion = projectionMatrix * viewPosition;
    gl_Position = projectionPostion;

    // Calculate point size to match exactly one pixel on screen
    float pointSize = size * pixelRatio;
    gl_PointSize = max(pointSize, 1.0);
    gl_PointSize *= (1.0 / -viewPosition.z);

    vColor = color;

    // Create a unique seed for each particle based on its position
    float seed = fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453) * 10.0;

    // Create a pulse with fade in/out
    float cycle = mod(time * speed + seed * 10.0, 10.0); // 10 second cycle
    float fadeIn = smoothstep(0.0, 0.3, cycle); // Fade in over 0.3s
    float fadeOut = smoothstep(1.0, 0.7, cycle); // Fade out over 0.3s
    float pulse = step(cycle, 1.0) * fadeIn * fadeOut; // Visible for 1s with fades

    vOpacity = clamp(opacity * pulse, 0.0, 1.0);

    vWorldPosition = modelPosition.xyz;
}
