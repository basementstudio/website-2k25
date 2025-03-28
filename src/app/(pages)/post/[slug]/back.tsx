import Link from "next/link"

import { Arrow } from "@/components/primitives/icons/arrow"

export const Back = () => (
  <Link
    href="/blog#list"
    className="actionable text-f-p-mobile text-brand-w1 lg:!sticky lg:top-13 lg:text-f-p"
  >
    <span className="actionable inline-flex items-center gap-1">
      <Arrow className="size-4 rotate-180" /> Blog
    </span>
  </Link>
)
