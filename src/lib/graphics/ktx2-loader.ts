import { LoadingManager } from "three"
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js"

/** Isolate Three's buffer-keyed transcode cache as well as our URL cache. */
export class RendererKTX2Loader extends KTX2Loader {
  private retired = false

  constructor() {
    super(new LoadingManager())
  }

  override parse(
    ...[buffer, onLoad, onError]: Parameters<KTX2Loader["parse"]>
  ) {
    if (this.retired) {
      onError?.(new Error("Texture requested after renderer disposal"))
      return
    }
    // FileLoader can coalesce an in-flight response across loader instances.
    // KTX2Loader's module-level task cache must not then share a texture decoded
    // for a different backend, or a pending job belonging to a retired worker.
    return super.parse(buffer.slice(0), onLoad, onError)
  }

  override dispose() {
    if (this.retired) return
    this.retired = true
    this.manager.abort()
    super.dispose()
  }
}
