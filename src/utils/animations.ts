export const easeInOutCubic = (x: number): number => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const linearPow2 = (x: number): number => {
    return x * x;
};

export const shaderAnimationConfig = {
    duration: 1.5,
    startTime: 0,
    startValue: 0,
    endValue: 1,
    easing:(x: number): number => {
    return x * x;
  },
};

export const cameraAnimationConfig = {
    duration: 1.5,
    progress: 0,
    easing: (x: number) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
};
    