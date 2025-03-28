import Link from "next/link"

import { Arrow } from "@/components/primitives/icons/arrow"

export const Back = () => (
  <Link
    href="/blog#list"
    className="lg:top-13 actionable h-3 text-f-p-mobile text-brand-w1 lg:!sticky lg:text-f-p"
  >
    <Arrow className="mr-1 size-4 rotate-180" />
    Blog
  </Link>
)
