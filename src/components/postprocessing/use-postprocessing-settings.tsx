import {
  postprocessingDebug,
  syncPostprocessingLeva
} from "@/components/debug/debug-state"

export const usePostprocessingSettings = () => {
  return {
    basics: postprocessingDebug.basics.current,
    bloom: postprocessingDebug.bloom.current,
    vignette: postprocessingDebug.vignette.current,
    setBasics: syncPostprocessingLeva.setBasics,
    setBloom: syncPostprocessingLeva.setBloom,
    setVignette: syncPostprocessingLeva.setVignette,
    hasChanged: postprocessingDebug.hasChanged
  }
}
