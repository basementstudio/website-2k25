import type { RichTextProps } from "basehub/react-rich-text"
import { RichText } from "basehub/react-rich-text"

import {
  BlogImage,
  BlogLink,
  BlogVideo,
  Code,
  CodeBlock,
  GridGallery,
  Heading2,
  Heading3,
  Intro,
  ListItem,
  OrderedList,
  Paragraph,
  Pre,
  QuoteWithAuthor,
  SideNote,
  UnorderedList
} from "@/app/(site)/(pages)/post/[slug]/blog-components"
import { Sandbox } from "@/app/(site)/(pages)/post/[slug]/components/sandbox"
import { CustomTweet } from "@/app/(site)/(pages)/post/[slug]/components/tweet"
import { QueryType } from "@/app/(site)/(pages)/post/[slug]/query"
import { cn } from "@/utils/cn"

interface JobContentProps {
  content: RichTextProps["content"]
}

export const JobContent = ({ content }: JobContentProps) => (
  <article
    className={cn(
      "flex w-full flex-col items-start text-brand-w2 lg:max-w-[846px]",
      "[&>*]:mt-6",
      "[&>h2]:mt-12"
    )}
  >
    <RichText
      content={content}
      components={{
        img: (props) => <BlogImage {...props} />,
        p: (props) => <Paragraph>{props.children}</Paragraph>,
        h2: (props) => <Heading2 id={props.id}>{props.children}</Heading2>,
        h3: (props) => <Heading3 id={props.id}>{props.children}</Heading3>,
        a: (props) => (
          <BlogLink href={props.href} target={props.target} rel={props.rel}>
            {props.children}
          </BlogLink>
        ),
        ul: (props) => (
          <UnorderedList isTasksList={false}>{props.children}</UnorderedList>
        ),
        ol: (props) => <OrderedList>{props.children}</OrderedList>,
        li: (props) => (
          <ListItem isTaskListItem={false}>{props.children}</ListItem>
        ),
        code: (props) => <Code>{props.children}</Code>,
        pre: (props) => (
          <Pre code={props.code} language={props.language}>
            {props.children}
          </Pre>
        ),
        video: (props) => <BlogVideo {...props} />,
        CodeBlockComponent: ({ files: { items } }) => (
          <CodeBlock items={items} />
        ),
        QuoteWithAuthorComponent: (props) => (
          <QuoteWithAuthor
            avatar={props.avatar}
            quote={props.quote?.json.content}
            author={props.author}
            role={props.role}
          />
        ),
        CodeSandboxComponent: (props) => <Sandbox keyName={props.sandboxKey} />,
        SideNoteComponent: (props) => (
          <SideNote>{props.content?.json.content}</SideNote>
        ),
        GridGalleryComponent: (props) => <GridGallery {...props} />,
        TweetComponent: (props) => <CustomTweet id={props.tweetId} />
      }}
    />
  </article>
)
