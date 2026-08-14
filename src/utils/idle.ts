// requestIdleCallback with a deadline, falling back to a timer (Safari has no
// requestIdleCallback). Used to push audio/asset warmup off interaction paths.
export const onIdle = (callback: () => void, timeout = 1500) => {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => callback(), { timeout })
    return
  }

  setTimeout(callback, timeout)
}
