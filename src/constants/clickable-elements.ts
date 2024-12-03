import { CameraStateKeys } from "@/store/app-store";

interface ClickableNode {
  name: string;
  route: string;
  routeName: CameraStateKeys;
}

export const CLICKABLE_NODES: ClickableNode[] = [
  {
    name: "SM_BasketballHoop",
    route: "/basketball",
    routeName: "hoop",
  },
  {
    name: "SM_ArcadeLab",
    route: "/arcade",
    routeName: "arcade",
  },
  {
    name: "SM_Stairs001",
    route: "/about",
    routeName: "stairs",
  },
];