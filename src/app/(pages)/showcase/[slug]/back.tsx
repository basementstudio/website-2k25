import Link from "next/link"

import { Arrow } from "@/components/primitives/icons/arrow"

export const Back = () => {
  return (
    <Link
      href="/showcase"
      className="actionable inline-flex items-center gap-1 text-p text-brand-w1"
    >
      <Arrow className="size-4 rotate-180" /> All Projects
    </Link>
  )
}
