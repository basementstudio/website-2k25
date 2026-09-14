const timerYield = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** Keep input/rendering responsive without accumulating nested-timer delays. */
export const yieldToBrowser = () => {
  const browser = globalThis as typeof globalThis & {
    scheduler?: { yield?: () => Promise<void> }
  }
  return (
    // An aborted host task must not strand the renderer's shared queue.
    browser.scheduler?.yield?.().catch(timerYield) ?? timerYield()
  )
}
