import { Leva } from "leva"
import { useSearchParams } from "next/navigation"
import { memo, Suspense, useEffect, useState } from "react"

function DebugInner() {
  const searchParams = useSearchParams()
  const [debug, setDebug] = useState(false)

  useEffect(() => {
    const hasDebg = searchParams.has("debug")
    if (!hasDebg) return
    setDebug(hasDebg)
  }, [searchParams])

  return (
    <div className="w-128 absolute bottom-8 right-64 z-50">
      <Leva collapsed fill hidden={!debug} />
    </div>
  )
}

export const Debug = memo(function DebugSuspense() {
  return (
    <Suspense fallback={null}>
      <DebugInner />
    </Suspense>
  )
})
