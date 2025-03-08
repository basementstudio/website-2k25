import { useAssets } from "../assets-provider"
import LoadingScene from "./loading-scene"

export function FallbackLoading() {
  const { officeWireframe } = useAssets()

  return <LoadingScene modelUrl={officeWireframe} />
}
