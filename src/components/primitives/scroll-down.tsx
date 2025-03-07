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
    <div className="fixed bottom-8 left-8 flex w-fit items-center gap-x-2 bg-brand-k px-1.5 py-0.5 text-p text-brand-w1">
      Scroll Down <ArrowDownIcon className="size-2.5" />
    </div>
  )
}
