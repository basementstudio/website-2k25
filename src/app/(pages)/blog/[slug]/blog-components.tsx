import { Language } from "basehub/react-code-block"
import { HandlerProps, RichTextProps } from "basehub/react-rich-text"
import Image from "next/image"

import { Link } from "@/components/primitives/link"
import { RichText } from "@/components/primitives/rich-text"

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
          className="aspect-video object-cover"
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
  <p className="text-pretty text-blog text-brand-w2">{children}</p>
)

export const Heading2 = ({ children }: HandlerProps<"h2">) => (
  <h2 className="text-pretty text-h2 text-brand-w2">{children}</h2>
)

export const Heading3 = ({ children }: HandlerProps<"h3">) => (
  <h3 className="text-pretty text-h3 text-brand-w2">{children}</h3>
)

export const BlogLink = ({ children, href }: HandlerProps<"a">) => (
  <Link href={href} className="font-semibold text-brand-w1 underline">
    {children}
  </Link>
)

export const OrderedList = ({ children }: HandlerProps<"ol">) => (
  <ol className="list-decimal pl-3.5 text-brand-w2 marker:text-brand-o [&_ol]:marker:!text-brand-g1">
    {children}
  </ol>
)

export const UnorderedList = ({ children }: HandlerProps<"ul">) => (
  <ul className="blog-list list-none pl-3.5 text-brand-w2 marker:text-brand-o [&_ul]:marker:!text-brand-g1">
    {children}
  </ul>
)

export const ListItem = ({ children }: HandlerProps<"li">) => (
  <li className="blog-list-item text-brand-w2 marker:text-p">{children}</li>
)

export const Code = ({ children }: HandlerProps<"code">) => (
  <code className="md:tracking-2 rounded-md border border-brand-g2 bg-codeblock-k2 px-1 font-mono text-p font-semibold">
    {children}
  </code>
)

export const Pre = ({ language, code }: HandlerProps<"pre">) => (
  <div className="w-full">
    <BaseCodeBlock
      snippets={[{ code: `${code}`, language: language, id: "1" }]}
    />
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
    <div className="group flex w-full flex-col gap-y-2">
      <BaseCodeBlock
        childrenTop={<CodeGroupHeader items={items} />}
        snippets={items.map((file) => ({
          code: `${file.codeSnippet.code}`,
          language: file.codeSnippet.language,
          label: file._title
        }))}
      />
    </div>
  )
}

export const QuoteWithAuthor = ({
  quote,
  author,
  role
}: {
  quote?: any
  author?: string | null
  role?: string | null
}) => {
  return (
    <div className="flex gap-x-4">
      <div className="h-full w-0.5 bg-brand-o" />

      <div className="flex flex-col gap-y-2.5">
        <div className="[&>*]:text-h4 [&>*]:text-brand-w2">
          <RichText>{quote}</RichText>
        </div>

        <div className="flex gap-x-2">
          {author ? <p className="text-p text-brand-w2">{author}</p> : null}
          {role ? <p className="text-p text-brand-g1">{role}</p> : null}
        </div>
      </div>
    </div>
  )
}

export const SideNote = ({
  children
}: {
  children: RichTextProps["content"]
}) => (
  <div className="flex w-full flex-col gap-2 rounded-[4px] border border-brand-g2 bg-codeblock-k2 px-6 py-4">
    <p className="text-p text-brand-w1">Note</p>

    <div className="[&>*]:text-brand-g1">
      <RichText>{children}</RichText>
    </div>
  </div>
)
