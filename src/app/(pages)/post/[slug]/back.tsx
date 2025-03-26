import Link from "next/link"

export const Back = () => (
  <Link
    href="/blog#list"
    className="col-span-1 col-start-1 text-f-p-mobile text-brand-w1 lg:text-f-p"
  >
    ← <span className="underline">Blog</span>
  </Link>
)
