import { TemplateName } from "../templates"
import { daylightShapesSketch } from "./daylight-sandbox"

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
    case "test-sandbox":
      return {
        files: {
          "sketch.js": daylightShapesSketch
        },
        template: "p5"
      }
  }
}
