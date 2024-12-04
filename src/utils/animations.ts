const easeInOutCubic = (x: number): number => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const linearPow2 = (x: number): number => {
    return x * x;
};

export const shaderAnimationConfig = {
    duration: 10,
    startTime: 0,
    startValue: 0,
    endValue: 1,
    easing: linearPow2,
};

export const cameraAnimationConfig = {
    duration: 1.5,
    progress: 0,
    easing: easeInOutCubic,
};
