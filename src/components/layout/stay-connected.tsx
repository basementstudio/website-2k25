import { RichTextNode } from "basehub/api-transaction"
import { RichText } from "basehub/react-rich-text"

import { Input } from "@/components/primitives/input"
import { cn } from "@/utils/cn"

interface StayConnectedProps {
  content: RichTextNode[]
  className?: string
}

export const StayConnected = ({ content, className }: StayConnectedProps) => (
  <div className={cn("grid grid-cols-4 gap-3", className)}>
    <RichText
      content={content}
      components={{
        h3: ({ children }) => (
          <p className="col-span-4 text-subheading text-brand-w2">{children}</p>
        ),
        p: ({ children }) => (
          <p className="col-start-1 col-end-4 text-paragraph text-brand-w2">
            {children}
          </p>
        )
      }}
    />
    <form className="col-span-4 flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Input className="col-span-4" placeholder="Name" />
        <Input className="col-span-4" placeholder="Email" />
      </div>
      <button className="col-span-4 w-fit text-paragraph text-brand-g1">
        Submit Form →
      </button>
    </form>
  </div>
)
