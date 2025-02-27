"use client"

import { useRouter } from "next/navigation"

import { Arrow } from "@/components/primitives/icons/arrow"

export const Back = () => {
  const router = useRouter()

  return (
    <button
      role="link"
      onClick={() => {
        router.push("/showcase?s=true")
      }}
      className="actionable inline-flex items-center gap-1 text-p text-brand-w1"
    >
      <Arrow className="size-4 rotate-180" /> All Projects
    </button>
  )
}
