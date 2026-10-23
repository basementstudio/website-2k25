import * as Sentry from "@sentry/nextjs"

// Rapier's wasm-bindgen objects take an internal borrow on every call. If a
// call throws partway through, wasm has no unwinding, so that borrow is never
// released and every later access to the same object throws "recursive use
// of an object detected which would lead to unsafe aliasing in rust" — even
// read-only checks like `RigidBody.isValid()`. Once that happens the world is
// unusable, so after the first failure we stop touching rapier entirely
// instead of crashing every frame.

let poisoned = false

export const isPhysicsPoisoned = () => poisoned

export const markPhysicsPoisoned = (error: unknown, context: string) => {
  if (poisoned) return
  poisoned = true
  Sentry.captureException(error, {
    tags: { "physics.poisoned": "true", "physics.context": context }
  })
}

/**
 * Runs `fn` against rapier unless physics is already poisoned. A throw
 * poisons physics (reported once) and returns `fallback` instead.
 */
export const safeRapier = <T>(context: string, fn: () => T, fallback: T): T => {
  if (poisoned) return fallback
  try {
    return fn()
  } catch (error) {
    markPhysicsPoisoned(error, context)
    return fallback
  }
}

/** Test-only: clear the poisoned flag. */
export const resetPhysicsPoisonedForTests = () => {
  poisoned = false
}
