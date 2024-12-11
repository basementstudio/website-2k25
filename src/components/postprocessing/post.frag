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
uniform sampler2D uBayerTexture;
varying vec2 vUv;

const float bayerMatrix16x16[256] = float[256](
    0.0/256.0,   192.0/256.0, 48.0/256.0,  240.0/256.0, 12.0/256.0,  204.0/256.0, 60.0/256.0,  252.0/256.0, 3.0/256.0,   195.0/256.0, 51.0/256.0,  243.0/256.0, 15.0/256.0,  207.0/256.0, 63.0/256.0,  255.0/256.0,
    128.0/256.0, 64.0/256.0,  176.0/256.0, 112.0/256.0, 140.0/256.0, 76.0/256.0,  188.0/256.0, 124.0/256.0, 131.0/256.0, 67.0/256.0,  179.0/256.0, 115.0/256.0, 143.0/256.0, 79.0/256.0,  191.0/256.0, 127.0/256.0,
    32.0/256.0,  224.0/256.0, 16.0/256.0,  208.0/256.0, 44.0/256.0,  236.0/256.0, 28.0/256.0,  220.0/256.0, 35.0/256.0,  227.0/256.0, 19.0/256.0,  211.0/256.0, 47.0/256.0,  239.0/256.0, 31.0/256.0,  223.0/256.0,
    160.0/256.0, 96.0/256.0,  144.0/256.0, 80.0/256.0,  172.0/256.0, 108.0/256.0, 156.0/256.0, 92.0/256.0,  163.0/256.0, 99.0/256.0,  147.0/256.0, 83.0/256.0,  175.0/256.0, 111.0/256.0, 159.0/256.0, 95.0/256.0,
    8.0/256.0,   200.0/256.0, 56.0/256.0,  248.0/256.0, 4.0/256.0,   196.0/256.0, 52.0/256.0,  244.0/256.0, 11.0/256.0,  203.0/256.0, 59.0/256.0,  251.0/256.0, 7.0/256.0,   199.0/256.0, 55.0/256.0,  247.0/256.0,
    136.0/256.0, 72.0/256.0,  184.0/256.0, 120.0/256.0, 132.0/256.0, 68.0/256.0,  180.0/256.0, 116.0/256.0, 139.0/256.0, 75.0/256.0,  187.0/256.0, 123.0/256.0, 135.0/256.0, 71.0/256.0,  183.0/256.0, 119.0/256.0,
    40.0/256.0,  232.0/256.0, 24.0/256.0,  216.0/256.0, 36.0/256.0,  228.0/256.0, 20.0/256.0,  212.0/256.0, 43.0/256.0,  235.0/256.0, 27.0/256.0,  219.0/256.0, 39.0/256.0,  231.0/256.0, 23.0/256.0,  215.0/256.0,
    168.0/256.0, 104.0/256.0, 152.0/256.0, 88.0/256.0,  164.0/256.0, 100.0/256.0, 148.0/256.0, 84.0/256.0,  171.0/256.0, 107.0/256.0, 155.0/256.0, 91.0/256.0,  167.0/256.0, 103.0/256.0, 151.0/256.0, 87.0/256.0,
    2.0/256.0,   194.0/256.0, 50.0/256.0,  242.0/256.0, 14.0/256.0,  206.0/256.0, 62.0/256.0,  254.0/256.0, 1.0/256.0,   193.0/256.0, 49.0/256.0,  241.0/256.0, 13.0/256.0,  205.0/256.0, 61.0/256.0,  253.0/256.0,
    130.0/256.0, 66.0/256.0,  178.0/256.0, 114.0/256.0, 142.0/256.0, 78.0/256.0,  190.0/256.0, 126.0/256.0, 129.0/256.0, 65.0/256.0,  177.0/256.0, 113.0/256.0, 141.0/256.0, 77.0/256.0,  189.0/256.0, 125.0/256.0,
    34.0/256.0,  226.0/256.0, 18.0/256.0,  210.0/256.0, 46.0/256.0,  238.0/256.0, 30.0/256.0,  222.0/256.0, 33.0/256.0,  225.0/256.0, 17.0/256.0,  209.0/256.0, 45.0/256.0,  237.0/256.0, 29.0/256.0,  221.0/256.0,
    162.0/256.0, 98.0/256.0,  146.0/256.0, 82.0/256.0,  174.0/256.0, 110.0/256.0, 158.0/256.0, 94.0/256.0,  161.0/256.0, 97.0/256.0,  145.0/256.0, 81.0/256.0,  173.0/256.0, 109.0/256.0, 157.0/256.0, 93.0/256.0,
    10.0/256.0,  202.0/256.0, 58.0/256.0,  250.0/256.0, 6.0/256.0,   198.0/256.0, 54.0/256.0,  246.0/256.0, 9.0/256.0,   201.0/256.0, 57.0/256.0,  249.0/256.0, 5.0/256.0,   197.0/256.0, 53.0/256.0,  245.0/256.0,
    138.0/256.0, 74.0/256.0,  186.0/256.0, 122.0/256.0, 134.0/256.0, 70.0/256.0,  182.0/256.0, 118.0/256.0, 137.0/256.0, 73.0/256.0,  185.0/256.0, 121.0/256.0, 133.0/256.0, 69.0/256.0,  181.0/256.0, 117.0/256.0,
    42.0/256.0,  234.0/256.0, 26.0/256.0,  218.0/256.0, 38.0/256.0,  230.0/256.0, 22.0/256.0,  214.0/256.0, 41.0/256.0,  233.0/256.0, 25.0/256.0,  217.0/256.0, 37.0/256.0,  229.0/256.0, 21.0/256.0,  213.0/256.0,
    170.0/256.0, 106.0/256.0, 154.0/256.0, 90.0/256.0,  166.0/256.0, 102.0/256.0, 150.0/256.0, 86.0/256.0,  169.0/256.0, 105.0/256.0, 153.0/256.0, 89.0/256.0,  165.0/256.0, 101.0/256.0, 149.0/256.0, 85.0/256.0
);

const mat4x4 crossHatchMatrix = mat4x4(
    15.0, 7.0, 13.0, 5.0,
    3.0, 11.0, 1.0, 9.0,
    12.0, 4.0, 14.0, 6.0,
    0.0, 8.0, 2.0, 10.0
) / 16.0;

float getDitherValue(vec2 uv) {
    int x = int(mod(uv.x * screenSize.x, 4.0));
    int y = int(mod(uv.y * screenSize.y, 4.0));
    
    if (uDitherPattern == 1) {
        // crosshatch pattern
        return crossHatchMatrix[y][x];
    } else {
        // bayer pattern
        x = int(mod(uv.x * screenSize.x, 16.0));
        y = int(mod(uv.y * screenSize.y, 16.0));
        return bayerMatrix16x16[y * 16 + x];
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

vec3 dither(vec2 uv, vec3 color) {
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    if (luminance > uBrightnessThreshold) {
        return color.rgb;
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

void main() {
    if (!uEnableShader) {
        gl_FragColor = texture2D(uMainTexture, vUv);
        return;
    }
    
    vec2 uv = vUv;
    vec2 normalizedPixelSize = (uPixelSize / dpr) / screenSize;
    uv = normalizedPixelSize * floor(vUv / normalizedPixelSize);
    
    vec4 color = texture2D(uMainTexture, uv);
    color.rgb *= uBrightness;
    color.rgb = dither(uv, color.rgb);
    gl_FragColor = color;
}
