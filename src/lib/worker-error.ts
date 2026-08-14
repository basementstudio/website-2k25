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

export interface WorkerErrorReport {
  error: Error
  detail?: string
}

/**
 * A failed script fetch reports the chunk hash, which turns over on every
 * deploy — keeping it out of the title keeps it in one Sentry issue.
 */
export function workerErrorReport(
  event: Event,
  name: string
): WorkerErrorReport {
  if (event instanceof ErrorEvent && event.error instanceof Error) {
    return { error: event.error }
  }

  return {
    error: new Error(`${name} worker failed to load`),
    detail: event instanceof ErrorEvent ? event.message : undefined
  }
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
