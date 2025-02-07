import { RichTextNode } from "basehub/api-transaction"
import { RichText as BaseRichText } from "basehub/react-rich-text"

import { Link } from "@/components/primitives/link"

export function RichText({
  children,
  content
}: {
  children?: any
  content?: RichTextNode[]
}) {
  return (
    <BaseRichText
      components={{
        a: ({ children, href }) => (
          <Link href={href} className="actionable text-brand-w1">
            {children}
          </Link>
        ),
        p: ({ children }) => <p className="text-p text-brand-w2">{children}</p>,
        ul: ({ children }) => <ul className="list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal">{children}</ol>,
        li: ({ children }) => <li className="text-brand-w1">{children}</li>,
        s: ({ children }) => <span className="actionable">{children}</span>
      }}
      content={content}
    >
      {children}
    </BaseRichText>
  )
}
