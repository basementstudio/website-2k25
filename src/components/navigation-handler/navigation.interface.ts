interface Tab {
  tabName: string
  tabRoute: string
  tabHoverName: string
  tabClickableName: string
  plusShapeScale: number
}

export interface ICameraConfig {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  targetScrollY: number
  offsetMultiplier: number
}

export interface IScene {
  name: string
  cameraConfig: ICameraConfig
  tabs: Tab[]
}
