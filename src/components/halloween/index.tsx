import dynamic from "next/dynamic"
import { Suspense, useState } from "react"

import { IsHalloweenSeason } from "@/utils/special-events"

const ClientHalloween = dynamic(
  () => import("./client").then((mod) => ({ default: mod.ClientHalloween })),
  {
    ssr: false,
    loading: () => null
  }
)

export const Halloween = () => {
  // Checked once: client-side navigation drops `?halloween` from the URL,
  // and the decorations shouldn't vanish on the next re-render.
  const [enabled] = useState(IsHalloweenSeason)

  if (!enabled) return null

  return (
    <Suspense fallback={null}>
      <ClientHalloween />
    </Suspense>
  )
}
