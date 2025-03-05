import { Leva } from "leva"
import Head from "next/head"
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

      {debug && (
        <>
          <Head>
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <script
              crossOrigin="anonymous"
              src="//unpkg.com/react-scan/dist/auto.global.js"
            />
          </Head>
        </>
      )}
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
