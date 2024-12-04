const easeInOutCubic = (x: number): number => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export const customPowTwo = (x: number): number => {
    return Math.pow(0.55 + x * 0.55, 5.5);
};

/*export const customPowTwo = (x: number): number => {
    return Math.pow(x, 2); // Simple quadratic growth
};*/

export const customExpoOut = (x: number): number => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};

export const cameraAnimationConfig = {
    duration: 1.5,
    progress: 0,
    easing: easeInOutCubic,
};
