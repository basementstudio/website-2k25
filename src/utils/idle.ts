// requestIdleCallback with a deadline, falling back to a timer (Safari has no
// requestIdleCallback). Used to push audio/asset warmup off interaction paths.
// Returns a cancel function so effects can drop a pending callback on cleanup
// (unmount, Strict Mode replay) instead of letting it fire into a dead tree.
export const onIdle = (callback: () => void, timeout = 1500): (() => void) => {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(() => callback(), { timeout })
    return () => cancelIdleCallback(id)
  }

  const id = setTimeout(callback, timeout)
  return () => clearTimeout(id)
}
