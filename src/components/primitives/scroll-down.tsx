import { useCurrentScene } from "@/hooks/use-current-scene"

import { ArrowDownIcon } from "../icons/icons"
import { useAppLoadingStore } from "../loading/app-loading-handler"

export const ScrollDown = () => {
  const scene = useCurrentScene()
  const canRunMainApp = useAppLoadingStore((state) => state.canRunMainApp)
  const is404 = scene === "404"
  const isArcade = scene === "lab"
  const isBasketball = scene === "basketball"

  const shouldIgnore = is404 || isArcade || isBasketball

  if (shouldIgnore || !canRunMainApp) return null

  return (
    <div className="fixed bottom-8 left-1/2 flex w-fit -translate-x-1/2 items-center gap-x-2 bg-brand-k px-1.5 py-0.5 text-p text-brand-w1">
      Scroll to Explore <ArrowDownIcon className="size-2.5" />
    </div>
  )
}
