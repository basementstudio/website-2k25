import { CameraStateKeys } from "@/store/app-store"

interface ClickableNode {
  name: string
  route: string
  routeName: CameraStateKeys
  arrowPosition?: [number, number, number]
  arrowRotation?: [number, number, number]
  arrowScale?: number
}

export const CLICKABLE_NODES: ClickableNode[] = [
  {
    name: "404_Hover",
    route: "/404",
    routeName: "projects"
  },
  {
    name: "About2_Hover",
    route: "/about",
    routeName: "stairs",
    arrowPosition: [-0.2, 0.5, 0],
    arrowScale: 0.6
  },
  {
    name: "Home_Hover",
    route: "/",
    routeName: "home"
  },
  {
    name: "Game_Hover",
    route: "/basketball",
    routeName: "hoop",
    arrowPosition: [-0.05, 0.6, 0],
    arrowScale: 0.6
  },
  {
    name: "Lab_Hover",
    route: "/arcade",
    routeName: "arcade",
    arrowPosition: [-0.05, 1.7, 0],
    arrowScale: 1
  },
  {
    name: "About1_Hover",
    route: "/about",
    routeName: "stairs",
    arrowPosition: [-0.5, 0.5, -1.2],
    arrowScale: 0.6
  },
  {
    name: "Projects_Hover",
    route: "/projects",
    routeName: "projects",
    arrowRotation: [0, 0.2, 0]
  },
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
]
