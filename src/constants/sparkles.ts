export const BASE_CONFIG = {
  color: "#bbb",
  speed: 0.25,
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
    count: 240
  },
  // Tvs
  {
    position: [8.3, 0.75, -13.4],
    scale: [2.5, 1.5, 0.75],
    count: 60
  },

  // Top Right Lamps
  {
    position: [11.1, 5.8, -18.5],
    scale: [1, 1, 5.5],
    count: 360
  },

  // Top Left
  {
    position: [4.1, 5.8, -18.6],
    scale: [1, 1, 3.75],
    count: 360
  },
  // Top Bottom Right Lamps
  {
    position: [11.1, 5.8, -25.6],
    scale: [1, 1, 3.75],
    count: 360
  },
  // Top Bottom Center Lamps
  {
    position: [7.25, 5.8, -25.6],
    scale: [1, 1, 3.75],
    count: 360
  },
  // Top Bottom Left Lamps
  {
    position: [4.1, 5.8, -25.6],
    scale: [1, 1, 3.75],
    count: 360
  }
]
