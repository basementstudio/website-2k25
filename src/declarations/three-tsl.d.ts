import type Node from "three/src/nodes/core/Node.js"
import type { NodeRepresentation, ShaderNodeObject } from "three/src/nodes/tsl/TSLCore.js"

declare module "three/src/nodes/accessors/TextureNode.js" {
  export default interface TextureNode {
    sample(uvNode: NodeRepresentation): ShaderNodeObject<Node>
  }
}
