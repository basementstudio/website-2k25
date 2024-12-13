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
uniform float uBrightness;
uniform bool uPreserveColors;
uniform int uDitherPattern;
uniform float uBrightnessThreshold;

// post
uniform float uGamma;
uniform float uContrast;
uniform float uExposure;

uniform sampler2D uBayerTexture;
uniform sampler2D uBayer16Texture;
uniform sampler2D uBlueNoiseTexture;

varying vec2 vUv;

const mat4x4 crossHatchMatrix = mat4x4(
    15.0, 7.0, 13.0, 5.0,
    3.0, 11.0, 1.0, 9.0,
    12.0, 4.0, 14.0, 6.0,
    0.0, 8.0, 2.0, 10.0
) / 16.0;

float getDitherValue(vec2 uv) {
    if (uDitherPattern == 1) {
        // crosshatch pattern
        int x = int(mod(uv.x * screenSize.x, 4.0));
        int y = int(mod(uv.y * screenSize.y, 4.0));
        return crossHatchMatrix[y][x];
    } else {
        vec2 bayerCoord = vec2(
            mod(gl_FragCoord.x, 16.0) / 16.0,
            mod(gl_FragCoord.y, 16.0) / 16.0
        );
        return texture2D(uBayer16Texture, bayerCoord).r;
    }
}

vec3 dither8x8(vec2 uv, vec3 color) {
    // gamma correction
    color.rgb = pow(color.rgb, vec3(2.2)) - 0.004;

    // get bayer matrix position
    vec2 bayerCoord = vec2(
        mod(gl_FragCoord.x, 8.0) / 8.0,
        mod(gl_FragCoord.y, 8.0) / 8.0
    );
    
    float bayerValue = texture2D(uBayerTexture, bayerCoord).r;

    return vec3(
        step(bayerValue, color.r),
        step(bayerValue, color.g),
        step(bayerValue, color.b)
    );
}

vec3 ditherBlueNoise(vec2 uv, vec3 color) {
    color.rgb = pow(color.rgb, vec3(2.2)) - 0.004;

    vec2 blueNoiseCoord = gl_FragCoord.xy / 128.0;
    float noiseValue = texture2D(uBlueNoiseTexture, blueNoiseCoord).r;
    
    float bias = 0.2;
    
    if (uPreserveColors) {
        float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        vec3 colorRatio = luminance > 0.0 ? color.rgb / luminance : vec3(0.0);
        return colorRatio * float(luminance > (noiseValue + bias));
    }
    
    return vec3(
        step(noiseValue + bias, color.r),
        step(noiseValue + bias, color.g),
        step(noiseValue + bias, color.b)
    );
}

vec3 dither(vec2 uv, vec3 color) {
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    if (luminance > uBrightnessThreshold) {
        return color.rgb;
    }

    if (uBayerSize == 999) {
        return ditherBlueNoise(uv, color);
    }

    if (uBayerSize == 8) {
        return dither8x8(uv, color);
    }

    float threshold = getDitherValue(uv);
    
    if (uPreserveColors) {
        if (luminance > 0.0) {
            vec3 colorRatio = color.rgb / luminance;
            float ditheredLuminance = luminance + (threshold - 0.5) * uTolerance;
            color.rgb = colorRatio * ditheredLuminance;
        }
    } else {
        color.rgb += (threshold - 0.5) * uTolerance;
    }
    
    // rgb quant
    vec3 scaled = color.rgb * (uColorNum - 1.0);
    vec3 rounded = floor(scaled + 0.5);
    color.rgb = rounded / (uColorNum - 1.0);
    
    return clamp(color.rgb, 0.0, 1.0);
}

// Tonemaping & gamma

vec3 gamma(vec3 color) {
    return pow(color, vec3(1.0 / 2.2)); // 2.2 is standard gamma correction value
}

vec3 gamma(vec3 color, float gamma) {
    return pow(color, vec3(1.0 / gamma));
}

vec3 invertedGamma(vec3 color) {
    return pow(color, vec3(2.2));
}

// // ACES filmic tone mapping approximation
vec3 acesFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// // Exposure tone mapping
vec3 exposureToneMap(vec3 color, float exposure) {
    return vec3(1.0) - exp(-color * exposure);
}

vec3 contrast(vec3 color, float contrast) {
    return color * contrast;
}

vec3 tonemap(vec3 color) {
    color = invertedGamma(color);
    color = exposureToneMap(color, uExposure);
    color = contrast(color, uContrast);
    color = acesFilm(color);
    color = gamma(color, uGamma); 
    return color;
}

void main() {

    vec4 baseColorSample = texture2D(uMainTexture, vUv);

    vec3 color = baseColorSample.rgb;

    if (!uEnableShader) {
        // gl_FragColor = vec4(color, 1.0);
        gl_FragColor = vec4(tonemap(color), 1.0);
        #include <colorspace_fragment>
        return;
    }
    
    vec2 uv = vUv;
    vec2 normalizedPixelSize = (uPixelSize / dpr) / screenSize;
    uv = normalizedPixelSize * floor(vUv / normalizedPixelSize);
    
    color.rgb *= uBrightness;
    color.rgb = dither(uv, color.rgb);
    // gl_FragColor = vec4(color, 1.0);

    gl_FragColor = vec4(tonemap(color), 1.0);
    #include <colorspace_fragment>
}