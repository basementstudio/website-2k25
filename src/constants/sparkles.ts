export const BASE_CONFIG = {
  color: "#bbb",
  speed: 0.2,
  size: 1
}

export const SPAWN_POINTS: {
  position: [number, number, number]
  scale: [number, number, number]
  count: number
}[] = [
  // Floor Center Light
  {
    position: [6.2, 0.25, -11.2],
    scale: [0.6, 0.25, 1.2],
    count: 80
  },
  // Floor Right Light
  {
    position: [8.2, 0.25, -11.2],
    scale: [0.6, 0.25, 1.2],
    count: 80
  },
  // Stairs Light
  {
    position: [4.3, 0.25, -11],
    scale: [1, 0.25, 1.8],
    count: 120
  },
  // Basement Logo
  {
    position: [8.4, 2.55, -14.4],
    scale: [1.9, 0.2, 0.2],
    count: 120
  },
  // Tvs
  {
    position: [8.3, 0.75, -13.4],
    scale: [2.5, 1.5, 0.75],
    count: 60
  },
  // Top Right Lamps
  {
    position: [11.1, 5.4, -18.5],
    scale: [1, 0.6, 5.5],
    count: 180
  },
  // Top Left
  {
    position: [4.1, 5.4, -18.6],
    scale: [1, 0.6, 3.75],
    count: 180
  },
  // Top Bottom Right Lamps
  {
    position: [11.1, 5.4, -25.6],
    scale: [1, 0.6, 3.75],
    count: 180
  },
  // Top Bottom Center Lamps
  {
    position: [7.25, 5.4, -25.6],
    scale: [1, 0.6, 3.75],
    count: 180
  },
  // Top Bottom Left Lamps
  {
    position: [4.1, 5.4, -25.6],
    scale: [1, 0.6, 3.75],
    count: 180
  }
]
