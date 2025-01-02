import { CameraStateKeys } from "@/store/app-store"

interface ClickableNode {
  name: string
  route: string
  routeName: CameraStateKeys
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
    routeName: "stairs"
  },
  {
    name: "Home_Hover",
    route: "/",
    routeName: "home"
  },
  {
    name: "Game_Hover",
    route: "/basketball",
    routeName: "hoop"
  },
  {
    name: "Lab_Hover",
    route: "/arcade",
    routeName: "arcade"
  },
  {
    name: "About1_Hover",
    route: "/about",
    routeName: "stairs"
  },
  {
    name: "Projects_Hover",
    route: "/projects",
    routeName: "projects"
  }
]
