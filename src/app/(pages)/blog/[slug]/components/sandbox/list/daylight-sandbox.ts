const gridSize = 15
const gridDivisions = 4
const diskSize = 80
const diskSamples = 100

const noiseFragmentShader = /*glsl*/ `
vec3 random3(vec3 c) {
  float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
  vec3 r;
  r.z = fract(512.0 * j);
  j *= .125;
  r.x = fract(512.0 * j);
  j *= .125;
  r.y = fract(512.0 * j);
  return r - 0.5;
}

float getNoise(vec2 uv, float screenWidth) {
  vec2 scaledUV = uv * screenWidth;
  vec3 seed = vec3(scaledUV, mod(scaledUV.x + scaledUV.y, screenWidth));
  vec3 noise = random3(seed);
  return noise.x * 0.3 + noise.y * 0.3 + noise.z * 0.4;
}
`

const baseDraw = `
totalIntersecting = grid.filter((point) => point.isIntersecting).length;
offscreenCanvas.shader(shaderProgram);
`

const endDraw = `
shaderProgram.setUniform("uTexture", offscreenBuffer);
shaderProgram.setUniform("wSize", p.width);
shaderProgram.setUniform("hSize", p.height);
offscreenCanvas.beginShape();
offscreenCanvas.vertex(-1, -1, 0, 0);
offscreenCanvas.vertex(1, -1, 1, 0);
offscreenCanvas.vertex(1, 1, 1, 1);
offscreenCanvas.vertex(-1, 1, 0, 1);
offscreenCanvas.endShape(p.CLOSE);

const sizeVec = p.createVector(p.width, p.height).mult(resultScale);
p.image(offscreenCanvas, 0, p.height - sizeVec.y, sizeVec.x, sizeVec.y);

p.fill(255,77,0);
p.noStroke();
const posBottom = p.height - (p.height - samplerPos.y) * resultScale;
p.ellipse(samplerPos.x * resultScale, posBottom, 4);
`
interface BaseParams {
  samplerType: "grid" | "vogel"
}

const base = ({ samplerType }: BaseParams) => `
  let samplerPos = { x: 0, y: 0 };
  let dragging = false;
  let offsetX, offsetY;

  let grid = [];
  let totalIntersecting = 0;

  ${
    samplerType === "grid"
      ? `
  const gridSize = ${gridSize};
  const gridDivisions = ${gridDivisions};
  `
      : `
  const diskSize = ${diskSize};
  const diskSamples = ${diskSamples};
  `
  }


  ${
    samplerType === "grid"
      ? `
  const createSampler = () => {
    for (let i = -gridDivisions; i <= gridDivisions; i++) {
      for (let j = -gridDivisions; j <= gridDivisions; j++) {
        if(i === 0 && j === 0) continue;
        grid.push({
          position: { x: i * gridSize, y: j * gridSize },
          size: 0,
          isIntersecting: false,
        });
      }
    }
  };`
      : `
  const createSampler = () => {
    // vogel disk sampling
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians

    for (let i = 1; i <= diskSamples; i++) {
      const r = diskSize * Math.sqrt(i / diskSamples);
      const theta = i * goldenAngle;

      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);

      grid.push({
        position: { x: x, y: y },
        size: 0,
        isIntersecting: false,
      });
    }
  };`
  }



  // Star position and size
  const starSize = 150;
  let starPos = { x: 0, y: 0 };

  // Rectangle position and size
  const rectSize = { width: 180, height: 180 };
  let rectPos = { x: 0, y: 0 };

  let offscreenBuffer, shaderProgram, offscreenCanvas;

  const calculateRectPos = (canvasWidth, canvasHeight) => {
    return { x: canvasWidth / 2 - rectSize.width / 2 + 200, y: canvasHeight / 2 - rectSize.height / 2 + 120 };
  };

  const calculateStarPos = (canvasWidth, canvasHeight) => {
    return { x: canvasWidth / 2 - 100, y: canvasHeight / 2 - 100 };
  };

  const resultScale = 1/3;
  const shaderScale = 1;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    offscreenBuffer = p.createGraphics(p.windowWidth, p.windowHeight);
    offscreenCanvas = p.createGraphics(p.windowWidth * shaderScale, p.windowHeight * shaderScale, p.WEBGL);
    shaderProgram = offscreenCanvas.createShader(vertexShader, fragmentShader);
    samplerPos = { x: p.width / 2, y: p.height / 2 };
    rectPos = calculateRectPos(p.width, p.height);
    starPos = calculateStarPos(p.width, p.height);
    createSampler();
  };

  p.mousePressed = () => {
    dragging = true;
    samplerPos = { x: p.mouseX, y: p.mouseY };
    offsetX = samplerPos.x - p.mouseX;
    offsetY = samplerPos.y - p.mouseY;
  };

  p.mouseDragged = () => {
    if (dragging) {
      samplerPos = { x: p.mouseX + offsetX, y: p.mouseY + offsetY };
    }
  };

  p.mouseReleased = () => {
    dragging = false;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    offscreenBuffer.resizeCanvas(p.windowWidth, p.windowHeight);
    offscreenCanvas.resizeCanvas(p.windowWidth * shaderScale, p.windowHeight * shaderScale);
    samplerPos = { x: p.width / 2, y: p.height / 2 };
    rectPos = calculateRectPos(p.width, p.height);
    starPos = calculateStarPos(p.width, p.height);
  };

  const shapeFill = (buffer, opacity, isShadowBuffer) => {
    const c = opacity * 255;
    buffer.fill(c, isShadowBuffer ? 255 : c, c)
  }

  const drawShapes = ({ buffer, fill, stroke, shadow = false }) => {
    // Draw shapes to the off-screen buffer
    buffer.background(0);
    buffer.noStroke();

    // Draw star to the buffer
    buffer.push();
    fill ? shapeFill(buffer, 0.15, shadow) : buffer.noFill();
    stroke ? buffer.stroke(255, 70) : buffer.noStroke();

    buffer.translate(starPos.x, starPos.y);
    buffer.beginShape();
    for (let i = 0; i < 5; i++) {
      buffer.vertex(starSize * Math.cos((p.TWO_PI * i) / 5), starSize * Math.sin((p.TWO_PI * i) / 5));
      buffer.vertex(starSize / 2 * Math.cos((p.TWO_PI * (i + 0.5)) / 5), starSize / 2 * Math.sin((p.TWO_PI * (i + 0.5)) / 5));
    }
    buffer.endShape(p.CLOSE);
    buffer.pop();

    // Draw rectangle to the buffer
    fill ? shapeFill(buffer, 0.95, shadow) : buffer.noFill();
    stroke ? buffer.stroke(255) : buffer.noStroke();
    buffer.rectMode(p.CORNER);
    buffer.rect(rectPos.x, rectPos.y, rectSize.width, rectSize.height);
  }

  // Draw draggable square
  const drawSampler = () => {
    p.rectMode(p.CENTER);
    p.fill(
      offscreenCanvas.get(samplerPos.x * shaderScale, samplerPos.y * shaderScale)[0],
    );
    p.stroke(255, 77, 0);
    p.strokeWeight(2);
    p.rect(samplerPos.x, samplerPos.y, 20, 20, 2);
  }


  const drawGrid = ({onlyWhenIntercepting = false} = {}) => {
    p.noStroke();
    const interceptedPoints = grid.filter((point) => point.isIntersecting);
    const nonInterceptedPoints = grid.filter((point) => !point.isIntersecting);
    if(!onlyWhenIntercepting) {
      nonInterceptedPoints.forEach((point) => {
        const circleX = samplerPos.x + point.position.x;
        const circleY = samplerPos.y + point.position.y;
        point.size > 10 ? p.fill(200, 20) : p.fill(255, 100);
        p.ellipse(circleX, circleY, point.size);

      });
    }
    interceptedPoints.forEach((point) => {
      const circleX = samplerPos.x + point.position.x;
      const circleY = samplerPos.y + point.position.y;
      point.size > 10 ? p.fill(0, 255, 0, point.size > 170 ? 10 : 50) : p.fill(0, 255, 0, 255);
      p.ellipse(circleX, circleY, point.size);
    });

    p.noFill();
    interceptedPoints.forEach((point) => {
      const circleX = samplerPos.x + point.position.x;
      const circleY = samplerPos.y + point.position.y;
      p.stroke(0, 50);
      p.ellipse(circleX, circleY, point.size);
    });
  }
`

const vertexShader = /*glsl*/ `
precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition, 1.0);
}
`

/// START
const vogelFragmentShader = /*glsl*/ `
precision highp float;
uniform sampler2D uTexture;
uniform highp float wSize;
uniform highp float hSize;

varying vec2 vTexCoord;

const float pi = 3.1415926535897932384626433832795;
const float goldenAngle = pi * (3.0 - sqrt(5.0)); // Golden angle in radians
const float diskSize = ${diskSize}.0;
const int diskSamples = ${diskSamples};
const float minSize = 20.;
const float maxSize = 300.;

vec3 rand(vec2 uv) {
  return vec3(
    fract(sin(dot(uv, vec2(12.75613, 38.12123))) * 13234.76575),
    fract(sin(dot(uv, vec2(19.45531, 58.46547))) * 43678.23431),
    fract(sin(dot(uv, vec2(23.67817, 78.23121))) * 93567.23423)
  );
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  int shadowCounter = 0;
  float shadowInfluence = 0.0;
  float noiseSample = rand(uv).x;

  float angle = noiseSample * pi;
  float cosAngle = cos(angle);
  float sinAngle = sin(angle);

  for (int i = 1; i <= diskSamples; i++) {
    float r = diskSize * sqrt(float(i) / float(diskSamples));
    float theta = float(i) * goldenAngle;

    vec2 offset;
    offset.x = r * cos(theta);
    offset.y = r * sin(theta);

    vec2 rotatedOffset;
    rotatedOffset.x = cosAngle * offset.x - sinAngle * offset.y;
    rotatedOffset.y = sinAngle * offset.x + cosAngle * offset.y;

    vec4 color = texture2D(uTexture, uv + rotatedOffset / vec2(wSize, hSize));
    if (color.r > 0.0 && color.g == 1.0) {
      float dist = length(offset);
      float size = color.r;
      size = (size * (maxSize - minSize)) + minSize;

      if (size / 2.0 >= dist) {
        shadowInfluence += mix(8.0, 0.5, size / maxSize);
        shadowCounter++;
      }
    }
  }

  float shadowFactor = shadowInfluence / float(diskSamples);
  shadowFactor = clamp(shadowFactor, 0.0, 0.8);
  vec3 color = vec3(1.0 - shadowFactor);

  gl_FragColor = vec4(color, 1.0);
}
`

export const daylightVogelScaleSketch = `export const sketch = (p) => {
  const vertexShader = \`${vertexShader}\`;
  const fragmentShader = \`${vogelFragmentShader}\`;

  ${base({ samplerType: "vogel" })}
  p.draw = () => {
    ${baseDraw}
    drawShapes({
      buffer: offscreenBuffer,
      fill: true,
      stroke: false,
      shadow: true
    })

    drawShapes({
      buffer: p,
      fill: true,
      stroke: true,
      shadow: false
    })


    grid.forEach((point) => {
      const circleX = samplerPos.x + point.position.x;
      const circleY = samplerPos.y + point.position.y;
      const sampledColor = offscreenBuffer.get(circleX, circleY);
      const minSize = 20
      const maxSize = 300
      if (sampledColor[0] > 0 && sampledColor[1] === 255) {
        let size = sampledColor[0] / 255;
        size = size * (maxSize - minSize) + minSize;

        point.size = size;
        point.isIntersecting = size/2 >= Math.hypot(circleX - samplerPos.x, circleY - samplerPos.y);
      } else {
        point.size = 5;
        point.isIntersecting = false;
      }
    });

    drawGrid()
    drawSampler()
    ${endDraw}
  };
};
`

/// END

const scaledFragmentShader = /*glsl*/ `
precision highp float;
uniform sampler2D uTexture;
uniform highp float wSize;
uniform highp float hSize;

varying vec2 vTexCoord;

const int gridSize = ${gridSize};
const int gridDivisions = ${gridDivisions};

const float minSize = 20.;
const float maxSize = 300.;

${noiseFragmentShader}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  vec3 finalColor = vec3(0.0);

  int shadowCounter = 0;
  float shadowInfluence = 0.0;
  float noiseSample = getNoise(uv, wSize);

  float angle = noiseSample * 3.14159265;
  float cosAngle = cos(angle);
  float sinAngle = sin(angle);

  for (int i = -gridDivisions; i <= gridDivisions; i++) {
    for (int j = -gridDivisions; j <= gridDivisions; j++) {
      vec2 offset = vec2(float(i * gridSize), float(j * gridSize));

      vec2 rotatedOffset;
      rotatedOffset.x = cosAngle * offset.x - sinAngle * offset.y;
      rotatedOffset.y = sinAngle * offset.x + cosAngle * offset.y;

      vec4 color = texture2D(uTexture, uv + rotatedOffset / vec2(wSize, hSize));
      if (color.r > 0.0 && color.g == 1.) {
        float dist = length(offset);
        float size = color.r;
        size = (size * (maxSize - minSize)) + minSize;

        if (size / 2. >= dist) {
          shadowInfluence += mix(8., 0.5, size / maxSize);
          shadowCounter++;
        }
      }
    }
  }

  float shadowFactor = shadowInfluence / float(gridDivisions * 2 + 1) / float(gridDivisions * 2 + 1);
  shadowFactor = clamp(shadowFactor, 0.0, 0.8);
  vec3 color = vec3(1. - shadowFactor);

  gl_FragColor = vec4(color, 1.0);
}
`

export const daylightGridScaleSketch = `export const sketch = (p) => {
  const vertexShader = \`${vertexShader}\`;
  const fragmentShader = \`${scaledFragmentShader}\`;

  ${base({ samplerType: "grid" })}
  p.draw = () => {
    ${baseDraw}
    drawShapes({
      buffer: offscreenBuffer,
      fill: true,
      stroke: false,
      shadow: true
    })

    drawShapes({
      buffer: p,
      fill: true,
      stroke: true,
      shadow: false
    })


    grid.forEach((point) => {
      const circleX = samplerPos.x + point.position.x;
      const circleY = samplerPos.y + point.position.y;
      const sampledColor = offscreenBuffer.get(circleX, circleY);
      const minSize = 20
      const maxSize = 300
      if (sampledColor[0] > 0 && sampledColor[1] === 255) {
        let size = sampledColor[0] / 255;
        size = size * (maxSize - minSize) + minSize;

        point.size = size;
        point.isIntersecting = size/2 >= Math.hypot(circleX - samplerPos.x, circleY - samplerPos.y);
      } else {
        point.size = 5;
        point.isIntersecting = false;
      }
    });

    drawGrid()
    drawSampler()
    ${endDraw}
  };
};
`

const gridNoiseFragmentShader = /*glsl*/ `
precision mediump float;
uniform sampler2D uTexture;
uniform float wSize;
uniform float hSize;

varying vec2 vTexCoord;

const int gridSize = ${gridSize};
const int gridDivisions = ${gridDivisions};

${noiseFragmentShader}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  float noiseSample = getNoise(uv, wSize);

  float angle = noiseSample * 3.14159265;
  float cosAngle = cos(angle);
  float sinAngle = sin(angle);

  int shadowCounter = 0;
  for (int i = -gridDivisions; i <= gridDivisions; i++) {
    for (int j = -gridDivisions; j <= gridDivisions; j++) {
      vec2 offset = vec2(i * gridSize, j * gridSize);

      vec2 rotatedOffset;
      rotatedOffset.x = cosAngle * offset.x - sinAngle * offset.y;
      rotatedOffset.y = sinAngle * offset.x + cosAngle * offset.y;

      vec4 color = texture2D(uTexture, uv + rotatedOffset / vec2(wSize, hSize));

      if (color.r > 0.0 && color.g == 1.) {
        shadowCounter++;
      }
    }
  }

  float shadowFactor = float(shadowCounter) / float((gridDivisions * 2 + 1) * (gridDivisions * 2 + 1));
  vec3 color = vec3(1. - shadowFactor);

  gl_FragColor = vec4(color, 1.0);
}
`

export const daylightGridNoiseSketch = `export const sketch = (p) => {
  const vertexShader = \`${vertexShader}\`;
  const fragmentShader = \`${gridNoiseFragmentShader}\`;

  ${base({ samplerType: "grid" })}
  p.draw = () => {
    ${baseDraw}
    drawShapes({
      buffer: offscreenBuffer,
      fill: true,
      stroke: false,
      shadow: true
    })

    drawShapes({
      buffer: p,
      fill: true,
      stroke: true,
      shadow: false
    })


    grid.forEach((point) => {
      const circleX = samplerPos.x + point.position.x;
      const circleY = samplerPos.y + point.position.y;
      const sampledColor = offscreenBuffer.get(circleX, circleY);
      if (sampledColor[0] > 0 && sampledColor[1] === 255) {
        point.size = 5;
        point.isIntersecting = true;
      } else {
        point.size = 5;
        point.isIntersecting = false;
      }
    });

    drawGrid()
    drawSampler()
    ${endDraw}
  };
};
`

const gridFragmentShader = /*glsl*/ `
precision mediump float;
uniform sampler2D uTexture;
uniform float wSize;

varying vec2 vTexCoord;

const int gridSize = ${gridSize};
const int gridDivisions = ${gridDivisions};

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;

  int shadowCounter = 0;
  for (int i = -gridDivisions; i <= gridDivisions; i++) {
    for (int j = -gridDivisions; j <= gridDivisions; j++) {
      vec2 offset = vec2(i * gridSize, j * gridSize);
      vec4 color = texture2D(uTexture, uv + offset / wSize);
      if (color.r > 0.0 && color.g == 1.) {
        shadowCounter++;
      }
    }
  }

  float shadowFactor = float(shadowCounter) / float((gridDivisions * 2 + 1) * (gridDivisions * 2 + 1));
  vec3 color = vec3(1. - shadowFactor);

  gl_FragColor = vec4(color, 1.0);
}
`

export const daylightGridSketch = `export const sketch = (p) => {
  const vertexShader = \`${vertexShader}\`;
  const fragmentShader = \`${gridFragmentShader}\`;

  ${base({ samplerType: "grid" })}
  p.draw = () => {
    ${baseDraw}
    drawShapes({
      buffer: offscreenBuffer,
      fill: true,
      stroke: false,
      shadow: true
    })

    drawShapes({
      buffer: p,
      fill: true,
      stroke: true,
      shadow: false
    })


    grid.forEach((point) => {
      const circleX = samplerPos.x + point.position.x;
      const circleY = samplerPos.y + point.position.y;
      const sampledColor = offscreenBuffer.get(circleX, circleY);
      if (sampledColor[0] > 0 && sampledColor[1] === 255) {
        point.size = 5;
        point.isIntersecting = true;
      } else {
        point.size = 5;
        point.isIntersecting = false;
      }
    });

    drawGrid()
    drawSampler()
    ${endDraw}
  };
};
`

export const daylightShapesSketch = `export const sketch = (p) => {

  const vertexShader = \`${vertexShader}\`;
  const fragmentShader = \`${gridFragmentShader}\`;

  ${base({ samplerType: "grid" })}
  p.draw = () => {
    ${baseDraw}
    drawShapes({
      buffer: offscreenBuffer,
      fill: true,
      stroke: false
    })

    drawShapes({
      buffer: p,
      fill: true,
      stroke: true
    })
  };
};
`
