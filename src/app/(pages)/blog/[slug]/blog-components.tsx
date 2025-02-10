import { Language } from "basehub/react-code-block"
import { HandlerProps } from "basehub/react-rich-text"
import Image from "next/image"

import { Link } from "@/components/primitives/link"

import { BaseCodeBlock } from "./components/code-block"
import styles from "./components/code-block.module.css"
import { CodeGroupHeader } from "./components/code-block-header"

export const BlogImage = ({ src, alt, width, height }: HandlerProps<"img">) => {
  if (!src) return null

  return (
    <div className="relative min-h-[312px] w-full after:absolute after:inset-0 after:border after:border-brand-w1/20">
      <div className="with-dots grid h-full w-full place-items-center">
        <Image
          src={src}
          width={width ?? 1920}
          height={height ?? 1080}
          className="w-[62.23%] object-contain"
          alt={alt ?? "Blog image"}
        />
      </div>
    </div>
  )
}

export const BlogVideo = (props: HandlerProps<"video">) => (
  <div className="relative min-h-[312px] w-full after:absolute after:inset-0 after:border after:border-brand-w1/20">
    <div className="with-dots grid h-full w-full place-items-center">
      <video
        autoPlay
        loop
        muted
        {...props}
        className="w-[62.23%] object-contain"
      />
    </div>
  </div>
)

export const Intro = ({ children }: HandlerProps<"p">) => (
  <p className="mb-10 text-h3 text-brand-w2">{children}</p>
)

export const Paragraph = ({ children }: HandlerProps<"p">) => (
  <p className="text-pretty text-p text-brand-w2">{children}</p>
)

export const Heading2 = ({ children }: HandlerProps<"h2">) => (
  <h2 className="text-h2 text-brand-w2">{children}</h2>
)

export const Heading3 = ({ children }: HandlerProps<"h3">) => (
  <h3 className="text-h3 text-brand-w2">{children}</h3>
)

export const BlogLink = ({ children, href }: HandlerProps<"a">) => (
  <Link href={href} className="font-semibold text-brand-w1 underline">
    {children}
  </Link>
)

export const OrderedList = ({ children }: HandlerProps<"ol">) => (
  <ul className="list-decimal pl-3.5 text-brand-w2 marker:text-brand-o">
    {children}
  </ul>
)

export const UnorderedList = ({ children }: HandlerProps<"ul">) => (
  <ul className="list-disc pl-3.5 text-brand-w2 marker:text-brand-o">
    {children}
  </ul>
)

export const ListItem = ({ children }: HandlerProps<"li">) => (
  <li className="text-brand-w2 marker:text-brand-o">{children}</li>
)

export const Code = ({ children }: HandlerProps<"code">) => (
  <code className="md:tracking-2 font-mono text-blog font-semibold">
    ‘{children}’
  </code>
)

export const Pre = ({ language, code }: HandlerProps<"pre">) => (
  <div className="w-full border-y border-brand-w2/20 bg-codeblock-k2 py-3">
    <div className={styles["code-block"]}>
      <BaseCodeBlock
        snippets={[{ code: `${code}`, language: language, id: "1" }]}
      />
    </div>
  </div>
)

export const CodeBlock = ({
  items
}: {
  items: {
    _id: string
    _title: string
    codeSnippet: {
      code: string
      language: Language
    }
  }[]
}) => {
  return (
    <div className="flex w-full flex-col gap-y-2">
      <BaseCodeBlock
        childrenTop={<CodeGroupHeader items={items} />}
        snippets={items.map((file, idx) => ({
          code: `${file.codeSnippet.code}`,
          language: file.codeSnippet.language
        }))}
      />
    </div>
  )
}
