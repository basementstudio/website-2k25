import {
  RichText as BaseRichText,
  type RichTextProps
} from "basehub/react-rich-text"

import { Link } from "@/components/primitives/link"

interface CustomRichTextProps {
  children: RichTextProps["content"]
  components?: RichTextProps["components"]
}

export const RichText = ({ children, components }: CustomRichTextProps) => (
  <BaseRichText
    content={children}
    components={{
      a: ({ children, href }) => (
        <Link href={href} className="text-brand-w1">
          <span className="actionable">{children}</span>
        </Link>
      ),
      p: ({ children }) => (
        <p className="text-f-p-mobile lg:text-f-p text-balance text-brand-w2">
          {children}
        </p>
      ),
      ul: ({ children }) => <ul className="list-disc">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal">{children}</ol>,
      li: ({ children }) => <li className="text-brand-w1">{children}</li>,
      s: ({ children }) => <span className="actionable">{children}</span>,
      ...components
    }}
  />
)
