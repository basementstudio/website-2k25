import { TemplateName } from "../templates"
import {
  daylightGridNoiseSketch,
  daylightGridScaleSketch,
  daylightGridSketch,
  daylightShapesSketch,
  daylightVogelScaleSketch
} from "./daylight-sandbox"

export type SandboxFiles = {
  [key: string]: string
}

export type Sandbox = {
  files: SandboxFiles
  template: TemplateName
}

/**
 * A sandbox is a collection of files that can be used to create a sandbox.
 * This will have a template name and a list of files that will be used to create the sandbox.
 * @returns
 */
export const getSandbox = (key: string) => {
  switch (key) {
    case "daylight-shapes":
      return {
        files: {
          "sketch.js": daylightShapesSketch
        },
        template: "p5"
      }
    case "daylight-grid":
      return {
        files: {
          "sketch.js": daylightGridSketch
        },
        template: "p5"
      }
    case "daylight-grid-noise":
      return {
        files: {
          "sketch.js": daylightGridNoiseSketch
        },
        template: "p5"
      }
    case "daylight-grid-scale":
      return {
        files: {
          "sketch.js": daylightGridScaleSketch
        },
        template: "p5"
      }
    case "daylight-vogel-scale":
      return {
        files: {
          "sketch.js": daylightVogelScaleSketch
        },
        template: "p5"
      }
    default:
      return null
  }
}
