import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"

export const Back = () => {
  return (
    <Link href="/showcase" className="text-p text-brand-w1">
      <span className="actionable inline-flex items-center gap-1">
        <Arrow className="size-4 rotate-180" /> All Projects
      </span>
    </Link>
  )
}
