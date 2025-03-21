import Link from "next/link"

import { Arrow } from "@/components/primitives/icons/arrow"

export const Back = () => (
  <Link
    href="/showcase#list"
    className="text-f-p-mobile lg:text-f-p text-brand-w1"
  >
    <span className="actionable inline-flex items-center gap-1">
      <Arrow className="size-4 rotate-180" /> All Projects
    </span>
  </Link>
)
