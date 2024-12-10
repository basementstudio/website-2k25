precision mediump float;

uniform sampler2D uMainTexture;
uniform float aspect;
uniform vec2 screenSize;
uniform float dpr;
uniform float uPixelSize;
uniform float uColorNum;
uniform int uBayerSize;
uniform bool uEnableShader;
uniform float uTolerance;

varying vec2 vUv;


const mat2x2 bayerMatrix2x2 = mat2x2(
    0.0, 2.0,
    3.0, 1.0
) / 4.0;

const mat4x4 bayerMatrix4x4 = mat4x4(
    0.0,  8.0,  2.0, 10.0,
    12.0, 4.0,  14.0, 6.0,
    3.0,  11.0, 1.0, 9.0,
    15.0, 7.0,  13.0, 5.0
) / 16.0;

const float bayerMatrix8x8[64] = float[64](
    0.0/ 64.0, 48.0/ 64.0, 12.0/ 64.0, 60.0/ 64.0,  3.0/ 64.0, 51.0/ 64.0, 15.0/ 64.0, 63.0/ 64.0,
  32.0/ 64.0, 16.0/ 64.0, 44.0/ 64.0, 28.0/ 64.0, 35.0/ 64.0, 19.0/ 64.0, 47.0/ 64.0, 31.0/ 64.0,
    8.0/ 64.0, 56.0/ 64.0,  4.0/ 64.0, 52.0/ 64.0, 11.0/ 64.0, 59.0/ 64.0,  7.0/ 64.0, 55.0/ 64.0,
  40.0/ 64.0, 24.0/ 64.0, 36.0/ 64.0, 20.0/ 64.0, 43.0/ 64.0, 27.0/ 64.0, 39.0/ 64.0, 23.0/ 64.0,
    2.0/ 64.0, 50.0/ 64.0, 14.0/ 64.0, 62.0/ 64.0,  1.0/ 64.0, 49.0/ 64.0, 13.0/ 64.0, 61.0/ 64.0,
  34.0/ 64.0, 18.0/ 64.0, 46.0/ 64.0, 30.0/ 64.0, 33.0/ 64.0, 17.0/ 64.0, 45.0/ 64.0, 29.0/ 64.0,
  10.0/ 64.0, 58.0/ 64.0,  6.0/ 64.0, 54.0/ 64.0,  9.0/ 64.0, 57.0/ 64.0,  5.0/ 64.0, 53.0/ 64.0,
  42.0/ 64.0, 26.0/ 64.0, 38.0/ 64.0, 22.0/ 64.0, 41.0/ 64.0, 25.0/ 64.0, 37.0/ 64.0, 21.0 / 64.0
);


vec3 dither(vec2 uv, vec3 color) {
    // Calculate luminance of the color
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    
    // Calculate color variance (how much the colors differ from each other)
    float colorVariance = max(max(abs(color.r - color.g), abs(color.g - color.b)), abs(color.r - color.b));
    
    // Check if we're dealing with a gradient (similar colors but different brightness)
    bool isGradient = colorVariance < uTolerance && luminance > uTolerance;
    
    if (isGradient) {
        // For gradients, just quantize without dithering
        color.r = floor(color.r * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
        color.g = floor(color.g * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
        color.b = floor(color.b * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
        return color;
    }

    // Get threshold from bayer matrix
    float threshold;
    if (uBayerSize == 2) {
        int x = int(uv.x * screenSize.x) % 2;
        int y = int(uv.y * screenSize.y) % 2;
        threshold = bayerMatrix2x2[y][x];
    } else if (uBayerSize == 4) {
        int x = int(uv.x * screenSize.x) % 4;
        int y = int(uv.y * screenSize.y) % 4;
        threshold = bayerMatrix4x4[y][x];
    } else {
        int x = int(uv.x * screenSize.x) % 8;
        int y = int(uv.y * screenSize.y) % 8;
        threshold = bayerMatrix8x8[y * 8 + x];
    }

    // Apply dithering with reduced intensity for subtle variations
    float ditherIntensity = mix(0.3, 0.6, colorVariance);
    color.rgb += threshold * ditherIntensity;
    
    // Quantize the result
    color.r = floor(color.r * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.g = floor(color.g * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.b = floor(color.b * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);

    return color;
}

void main() {
    if (!uEnableShader) {
        gl_FragColor = texture2D(uMainTexture, vUv);
        return;
    }
    
    vec2 uv = vUv;
    vec2 normalizedPixelSize = uPixelSize / screenSize;
    uv = normalizedPixelSize * floor(vUv / normalizedPixelSize);
    
    vec4 color = texture2D(uMainTexture, uv);
    color.rgb = dither(uv, color.rgb);
    gl_FragColor = color;
}
