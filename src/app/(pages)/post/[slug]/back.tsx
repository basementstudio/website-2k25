import Link from "next/link"

export const Back = () => {
  return (
    <Link href="/blog" className="col-span-1 col-start-1 text-brand-w1">
      ← <span className="underline">Blog</span>
    </Link>
  )
}
