interface ValidatableBody {
  isValid(): boolean
}

/**
 * Returns the rigid body held by `ref` only while its Rapier handle is still
 * alive, otherwise null.
 *
 * Rapier handles can outlive React refs by a frame around unmount. Calling
 * any method on a freed handle panics inside the WASM, and because wasm32
 * panics trap without unwinding, the rigid-body set's borrow flag is never
 * released — every later Rapier call then throws "recursive use of an object
 * detected which would lead to unsafe aliasing in rust". Always go through
 * this guard before touching a body that may have been unmounted.
 */
export const getLiveBody = <T extends ValidatableBody>(ref: {
  current: T | null | undefined
}): T | null => {
  const body = ref.current
  if (!body) return null
  return body.isValid() ? body : null
}
