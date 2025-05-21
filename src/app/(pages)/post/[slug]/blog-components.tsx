import { Language } from "basehub/react-code-block"
import { HandlerProps, RichTextProps } from "basehub/react-rich-text"
import Image from "next/image"

import { Link } from "@/components/primitives/link"
import { RichText } from "@/components/primitives/rich-text"
import { Video } from "@/components/primitives/video"
import { ImageFragment } from "@/service/basehub/fragments"

import { BaseCodeBlock } from "./components/code-block"
import { CodeGroupHeader } from "./components/code-block-header"

export const BlogImage = ({
  src,
  alt,
  width,
  height,
  caption
}: HandlerProps<"img">) => {
  if (!src) return null

  return (
    <div className="flex w-full flex-col gap-y-2">
      <div
        className="image relative aspect-video w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20"
        style={{ aspectRatio: width ? `${width}/${height}` : "16/9" }}
      >
        <div className="with-dots grid h-full w-full place-items-center">
          <Image
            src={src}
            fill
            className="object-cover"
            alt={alt ?? "Blog image"}
          />
        </div>
      </div>
      {caption && (
        <p className="text-f-p-mobile text-brand-w1/50 lg:text-f-p">
          {caption}
        </p>
      )}
    </div>
  )
}

export const BlogVideo = (props: HandlerProps<"video">) => (
  <div className="video relative w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20">
    <div className="with-dots grid h-full w-full place-items-center">
      <Video autoPlay loop muted {...props} className="object-cover" />
    </div>
  </div>
)

export const Intro = ({ children }: HandlerProps<"p">) => (
  <p className="text-f-h3-mobile text-brand-w2 lg:text-f-h3 [&_b]:font-bold [&_b]:text-brand-w1">
    {children}
  </p>
)

export const Paragraph = ({ children }: HandlerProps<"p">) => (
  <p className="!text-pretty text-blog text-brand-w1 [&_b]:font-bold [&_b]:text-brand-w1">
    {children}
  </p>
)

export const Heading2 = ({ children }: HandlerProps<"h2">) => (
  <h2 className="text-balance text-f-h2-mobile text-brand-w1 lg:text-f-h2 [&_b]:font-semibold">
    {children}
  </h2>
)

export const Heading3 = ({ children }: HandlerProps<"h3">) => (
  <h3 className="text-balance text-f-h3-mobile text-brand-w1 lg:text-f-h3 [&_b]:font-semibold">
    {children}
  </h3>
)

export const BlogLink = ({
  children,
  href,
  target,
  rel
}: HandlerProps<"a">) => (
  <Link
    href={href}
    target={target as "_blank" | "_self"}
    rel={rel}
    className="font-semibold text-brand-w1 underline"
  >
    {children}
  </Link>
)

export const OrderedList = ({ children }: HandlerProps<"ol">) => (
  <ol className="list-decimal pl-5 text-brand-w2 marker:text-brand-o [&_ol]:marker:!text-brand-g1">
    {children}
  </ol>
)

export const UnorderedList = ({ children }: HandlerProps<"ul">) => (
  <ul className="blog-list list-none pl-5 text-brand-w2 marker:text-brand-o [&_ul]:marker:!text-brand-g1">
    {children}
  </ul>
)

export const ListItem = ({ children }: HandlerProps<"li">) => (
  <li className="blog-list-item pl-2 text-brand-w2 marker:text-f-p-mobile lg:text-f-p">
    {children}
  </li>
)

export const Code = ({ children }: HandlerProps<"code">) => (
  <code className="md:tracking-2 rounded-md border border-brand-g2 bg-codeblock-k2 px-1 font-mono text-f-p-mobile font-semibold lg:text-f-p">
    {children}
  </code>
)

export const Pre = ({ language, code }: HandlerProps<"pre">) => (
  <div className="w-full overflow-hidden">
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
    <div className="custom-block sandbox group flex w-full flex-col gap-y-2">
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

interface QuoteWithAuthorProps {
  quote?: any
  author?: string | null
  role?: string | null
  avatar?: ImageFragment | null
}

export const QuoteWithAuthor = ({
  quote,
  author,
  role,
  avatar
}: QuoteWithAuthorProps) => (
  <div className="custom-block relative mb-4 flex gap-x-4">
    <div className="flex w-full flex-col gap-y-2.5">
      <div className="lg:text-f-h2 [&>*]:text-f-h2-mobile [&>*]:text-brand-w2">
        <RichText>{quote}</RichText>
      </div>

      <div className="flex flex-wrap items-center gap-x-2">
        {avatar ? (
          <Image
            src={avatar.url}
            alt={avatar.alt ?? `Avatar for ${author}`}
            width={avatar.width}
            height={avatar.height}
            className="size-8 rounded-full object-cover"
          />
        ) : null}

        {author ? (
          <p className="text-f-p-mobile text-brand-w2 lg:text-f-p">{author}</p>
        ) : null}
        {role ? (
          <p className="text-f-p-mobile text-brand-g1 lg:text-f-p">{role}</p>
        ) : null}
      </div>
    </div>
  </div>
)

interface SideNoteProps {
  children: RichTextProps["content"]
}

export const SideNote = ({ children }: SideNoteProps) => (
  <div className="custom-block flex w-full flex-col gap-2 rounded-[0.25rem] border border-brand-g2 bg-codeblock-k2 px-6 py-4">
    <p className="text-blog text-brand-w1">Note</p>

    <div className="[&>*]:text-brand-g1">
      <RichText
        components={{
          p: ({ children }) => <p className="text-blog">{children}</p>
        }}
      >
        {children}
      </RichText>
    </div>
  </div>
)
