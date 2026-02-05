"use client"

import { NodeMaterial } from "three/webgpu"

const _material = new NodeMaterial()
_material.colorWrite = false
_material.depthWrite = false

export function MeshDiscardMaterial() {
  return <primitive object={_material} attach="material" />
}
