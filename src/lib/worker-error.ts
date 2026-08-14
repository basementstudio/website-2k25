// Imported by the workers, so it must stay free of the Sentry SDK — importing
// it here would pull a second copy of the client into every worker bundle.
const WORKER_ERROR = "worker-error"

/**
 * Workers only reach Sentry through the main thread. Uncaught errors already
 * surface there as the worker's `error` event; this is for the handled ones,
 * which would otherwise stay inside the worker.
 */
export function postWorkerError(error: unknown) {
  const { name, message, stack } =
    error instanceof Error ? error : new Error(String(error))

  self.postMessage({ type: WORKER_ERROR, name, message, stack })
}

/** Rebuilds the worker's error on the main thread, keeping its stack. */
export function workerErrorFromMessage(data: unknown): Error | null {
  if (typeof data !== "object" || data === null) return null

  const message = data as Record<string, unknown>
  if (message.type !== WORKER_ERROR || typeof message.message !== "string") {
    return null
  }

  const error = new Error(message.message)
  if (typeof message.name === "string") error.name = message.name
  if (typeof message.stack === "string") error.stack = message.stack

  return error
}
