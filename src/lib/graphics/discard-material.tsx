/** Invisible picking geometry, compatible with both renderer backends. */
export function MeshDiscardMaterial() {
  return (
    <meshBasicMaterial
      colorWrite={false}
      depthWrite={false}
      depthTest={false}
    />
  )
}
