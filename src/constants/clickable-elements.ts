import { CameraStateKeys } from "@/store/app-store";

interface ClickableNode {
  name: string;
  route: string;
  routeName: CameraStateKeys;
}

export const CLICKABLE_NODES: ClickableNode[] = [
  {
    name: "SM_BasketballHoop_Hover",
    route: "/basketball",
    routeName: "hoop",
  },
  {
    name: "SM_ArcadeLab_Hover",
    route: "/arcade",
    routeName: "arcade",
  },
  {
    name: "SM_Stairs001_Hover",
    route: "/about",
    routeName: "stairs",
  },
];
