import { events, unmountComponentAtNode } from "@react-three/fiber"

/** Fiber's async configure can finish after its Canvas has been removed. */
export const createSiteEvents: typeof events = (store) => {
  const manager = events(store)
  const connect = manager.connect
  manager.connect = (target) => {
    if (!target || !(target as HTMLElement).isConnected) {
      const renderer = store.getState().gl
      const canvas = renderer.domElement
      // A late configure must not resurrect an orphan render root. Run outside
      // React's commit, using Fiber's normal resource and event cleanup.
      queueMicrotask(() => {
        unmountComponentAtNode(canvas)
        // Initialization may finish before RendererLifetime ever mounts.
        renderer.dispose()
      })
      return
    }
    connect?.(target)
  }
  return manager
}
