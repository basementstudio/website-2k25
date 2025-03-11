import { Leva } from "leva"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { memo, Suspense, useEffect, useState } from "react"

const OnlyDebug = dynamic(
  () => import("./only-debug").then((mod) => mod.OnlyDebug),
  {
    ssr: false,
    loading: () => null
  }
)

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
      <Suspense fallback={null}>{debug && <OnlyDebug />}</Suspense>
    </div>
  )
}

export const Debug = memo(DebugInner)
