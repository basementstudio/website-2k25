import { CameraStateKeys } from "@/store/app-store"

interface FrameType {
  frameType: "plane" | "box"
}

interface BaseClickableNode {
  name: string
  route: string
  routeName: CameraStateKeys
  arrowPosition?: [number, number, number]
  arrowScale?: number
  framePosition?: [number, number, number]
  frameRotation?: [number, number, number]
}

interface PlaneNode extends BaseClickableNode, FrameType {
  frameType: "plane"
  frameSize?: [number, number]
}

interface BoxNode extends BaseClickableNode, FrameType {
  frameType: "box"
  frameSize?: [number, number, number]
}

type ClickableNode = PlaneNode | BoxNode

export const CLICKABLE_NODES: ClickableNode[] = [
  {
    name: "Home_Hover",
    route: "/",
    routeName: "home",
    frameType: "plane",
    framePosition: [6.32, 0.05, -10.05],
    frameRotation: [-Math.PI / 2, 0, 0],
    frameSize: [3.3, 3.35]
  },
  {
    name: "Lab_Hover",
    route: "/arcade",
    routeName: "arcade",
    arrowPosition: [-0.05, 2.4, 0],
    arrowScale: 0.4,
    frameType: "box",
    framePosition: [2.98, 1.08, -14.1],
    frameSize: [1, 2.12, 0.8]
  },
  {
    name: "About2_Hover",
    route: "/about",
    routeName: "stairs",
    arrowPosition: [-0.2, 0.5, 0],
    arrowScale: 0.4,
    frameType: "plane",
    framePosition: [8.4, 2.54, -14.3],
    frameRotation: [0, 0, 0],
    frameSize: [2, 0.5]
  },
  {
    name: "Game_Hover",
    route: "/basketball",
    routeName: "hoop",
    arrowPosition: [-0.05, 0.6, 0],
    arrowScale: 0.4,
    frameType: "plane",
    framePosition: [5.23, 3.3, -14.3],
    frameRotation: [0, 0, 0],
    frameSize: [1.55, 1.28]
  },

  {
    name: "About1_Hover",
    route: "/about",
    routeName: "stairs",
    arrowPosition: [-0.5, 0.5, -1.2],
    arrowScale: 0.4,
    frameType: "plane",
    framePosition: [2.12, 2.25, -8.5]
  },
  {
    name: "Projects_Hover",
    route: "/projects",
    routeName: "projects",
    arrowPosition: [0, -0.5, 2],
    arrowScale: 0.4,
    frameType: "plane",
    framePosition: [2.12, 3.57, -12.68],
    frameRotation: [0, Math.PI / 2, 0],
    frameSize: [3.3, 2.43]
  }
]

/**
 {
    name: "Career-Services_Hover",
    route: "/careers",
    routeName: "careers"
  },
  {
    name: "Blog_Hover",
    route: "/blog",
    routeName: "blog"
  }
 */
