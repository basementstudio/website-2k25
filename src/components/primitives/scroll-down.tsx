import { useCurrentScene } from "@/hooks/use-current-scene"

import { ArrowDownIcon } from "../icons/icons"

export const ScrollDown = () => {
  const scene = useCurrentScene()
  const is404 = scene === "404"
  const isArcade = scene === "lab"
  const isBasketball = scene === "basketball"

  const shouldIgnore = is404 || isArcade || isBasketball

  if (shouldIgnore) return null

  return (
    <div className="fixed bottom-8 left-1/2 -mb-3 inline-block -translate-x-1/2 px-10 py-3">
      <p className="flex items-center gap-x-2 bg-brand-k px-1.5 py-0.5 text-p text-brand-w1">
        Scroll to Explore <ArrowDownIcon className="size-2.5" />
      </p>
    </div>
  )
}
