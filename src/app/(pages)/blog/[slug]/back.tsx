"use client"

import { useRouter } from "next/navigation"

export const Back = () => {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push("/blog?s=true")}
      className="col-span-1 col-start-1 text-brand-w1"
    >
      ← <span className="underline">Blog</span>
    </button>
  )
}
