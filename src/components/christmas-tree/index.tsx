import dynamic from "next/dynamic"
import { Suspense } from "react"

import { IsChristmasSeason } from "@/utils/special-events"

const ClientChristmasTree = dynamic(
  () =>
    import("./client").then((mod) => ({ default: mod.ClientChristmasTree })),
  {
    ssr: false,
    loading: () => null
  }
)

export const ChristmasTree = () => {
  const isChristmasSeason = IsChristmasSeason()

  if (!isChristmasSeason) return null

  return (
    <Suspense fallback={null}>
      <ClientChristmasTree />
    </Suspense>
  )
}
