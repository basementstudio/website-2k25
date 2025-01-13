import {
  CodeBlock,
  createCssVariablesTheme,
  type Language
} from "basehub/react-code-block"
import { HandlerProps } from "basehub/react-rich-text"
import Image from "next/image"
import Link from "next/link"
import { ReactNode } from "react"

import styles from "./code-block.module.css"

const theme = createCssVariablesTheme({
  name: "basement",
  variablePrefix: "--bsmnt-",
  variableDefaults: {
    "color-text": "var(--bsmnt-color-text)",
    "token-constant": "var(--bsmnt-token-constant)",
    "token-string": "var(--bsmnt-token-string)",
    "token-comment": "var(--bsmnt-token-comment)",
    "token-keyword": "var(--bsmnt-token-keyword)",
    "token-parameter": "var(--bsmnt-token-parameter)",
    "token-function": "var(--bsmnt-token-function)",
    "token-string-expression": "var(--bsmnt-token-string-expression)",
    "token-punctuation": "var(--bsmnt-token-punctuation)",
    "token-link": "var(--bsmnt-token-link)",
    "token-tag": "var(--bsmnt-token-tag)",
    "token-tag-name": "var(--bsmnt-token-tag-name)",
    "token-attr-name": "var(--bsmnt-token-attr-name)",
    "token-attr-value": "var(--bsmnt-token-attr-value)",
    "token-operator": "var(--bsmnt-token-operator)",
    "token-builtin": "var(--bsmnt-token-builtin)",
    "token-class-name": "var(--bsmnt-token-class-name)"
  },
  fontStyle: true
})

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

export const BlogVideo = (props: HandlerProps<"video">) => {
  return (
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
}

export const Intro = ({ children }: HandlerProps<"p">) => {
  return <p className="mb-10 text-subheading text-brand-w2">{children}</p>
}

export const Paragraph = ({ children }: HandlerProps<"p">) => {
  return <p className="text-pretty text-blog text-brand-w2">{children}</p>
}

export const Heading2 = ({ children }: HandlerProps<"h2">) => {
  return <h2 className="text-subheading text-brand-w2">{children}</h2>
}

export const Heading3 = ({ children }: HandlerProps<"h3">) => {
  return <h3 className="text-subheading text-brand-w2">{children}</h3>
}

export const BlogLink = ({ children, href }: HandlerProps<"a">) => {
  return (
    <Link
      href={href}
      target={href.includes("https") ? "_blank" : "_self"}
      className="font-semibold text-brand-w1 underline"
    >
      {children}
    </Link>
  )
}

export const OrderedList = ({ children }: HandlerProps<"ol">) => {
  return (
    <ul className="list-decimal pl-3.5 text-brand-w2 marker:text-brand-o">
      {children}
    </ul>
  )
}

export const UnorderedList = ({
  children,
  isTasksList
}: HandlerProps<"ul"> & { isTasksList?: boolean }) => {
  return (
    <ul className="list-disc pl-3.5 text-brand-w2 marker:text-brand-o">
      {children}
    </ul>
  )
}

export const ListItem = ({ children }: HandlerProps<"li">) => {
  return <li className="text-brand-w2 marker:text-brand-o">{children}</li>
}

export const Code = ({ children }: HandlerProps<"code">) => {
  return (
    <code className="md:tracking-2 font-mono text-blog font-semibold">
      ‘{children}’
    </code>
  )
}

export const Pre = ({ language, code }: HandlerProps<"pre">) => {
  return (
    <div className="bg-codeblock-k2 w-full border-y border-brand-w2/20 py-3">
      <div className={styles["code-block"]}>
        <CodeBlock
          snippets={[
            { code: `${code}`, language: language as Language, id: "1" }
          ]}
          theme={theme}
          components={{
            div: ({ children, ...rest }: { children: ReactNode }) => (
              <div className={styles.content} {...rest}>
                {children}
              </div>
            ),
            pre: ({ children, ...rest }: { children: ReactNode }) => (
              <pre className={styles.pre} {...rest}>
                {children}
              </pre>
            )
          }}
          lineNumbers={{
            className: styles.line_indicator
          }}
        />
      </div>
    </div>
  )
}
