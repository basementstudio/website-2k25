import { RichTextNode } from "basehub/api-transaction"
import { RichText } from "basehub/react-rich-text"

import { subscribe } from "@/app/actions/subscribe"
import { Input } from "@/components/primitives/input"
import { cn } from "@/utils/cn"

import { Arrow } from "../primitives/icons/arrow"

interface StayConnectedProps {
  content: RichTextNode[]
  className?: string
}

export const StayConnected = ({ content, className }: StayConnectedProps) => {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
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
      <form action={subscribe} className="flex flex-col gap-4">
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
          Roll me in <Arrow className="size-3" />
        </button>
      </form>
    </div>
  )
}
