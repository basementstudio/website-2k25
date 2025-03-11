import { RichTextNode } from "basehub/api-transaction"
import { RichText } from "basehub/react-rich-text"

import { subscribe } from "@/app/actions/subscribe"
import { Arrow } from "@/components/primitives/icons/arrow"
import { Input } from "@/components/primitives/input"
import { cn } from "@/utils/cn"

interface StayConnectedProps {
  content: RichTextNode[]
  className?: string
}

export const StayConnected = ({ content, className }: StayConnectedProps) => {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-4 gap-2">
        <RichText
          content={content}
          components={{
            h3: ({ children }) => (
              <p className="col-span-3 text-h3 text-brand-w2">{children}</p>
            ),
            p: ({ children }) => (
              <p className="col-span-3 text-p text-brand-w2">{children}</p>
            )
          }}
        />
      </div>
      <form action={subscribe} className="flex max-w-[26.25rem] flex-col gap-2">
        <Input
          placeholder="Enter your Email"
          required
          type="email"
          name="email"
        />
        <button
          type="submit"
          className="flex w-fit translate-y-1 items-center gap-1 text-p text-brand-g1"
        >
          <span className="actionable actionable-no-underline gap-x-1 font-bold">
            Roll me in <Arrow className="size-4" />
          </span>
        </button>
      </form>
    </div>
  )
}
