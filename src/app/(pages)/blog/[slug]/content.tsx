import { RichText } from "basehub/react-rich-text"
import { Tweet } from "react-tweet"

import { cn } from "@/utils/cn"

import { QueryType } from "../query"
import {
  BlogImage,
  BlogLink,
  BlogVideo,
  Code,
  CodeBlock,
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
} from "./blog-components"
import BlogMeta from "./blog-meta"
import Sandbox from "./components/sandbox"

export default function Content({
  data,
  slug
}: {
  data: QueryType
  slug: string
}) {
  const post = data.pages.blog.posts.items.find((post) => post._slug === slug)
  const intro = post?.intro?.json.content
  const content = post?.content?.json.content

  return (
    <div className="grid-layout">
      <div className="col-span-full flex flex-col items-center justify-start">
        {post && <BlogMeta categories data={post as any} />}
        <article
          className={cn(
            "col-span-full flex w-full flex-col items-start text-brand-w2 lg:max-w-[846px]",
            // 24px between elements
            "[&>*]:mt-6",
            // 32px to headings
            "[&>h2]:mt-12",
            // 32 px to custom blocks
            "[&>.custom-block]:mt-12"
          )}
        >
          <RichText
            content={intro}
            components={{
              p: (props) => <Intro>{props.children}</Intro>
            }}
          />
          <RichText
            content={content}
            components={{
              img: (props) => <BlogImage {...props} />,
              p: (props) => <Paragraph>{props.children}</Paragraph>,
              h2: (props) => (
                <Heading2 id={props.id}>{props.children}</Heading2>
              ),
              h3: (props) => (
                <Heading3 id={props.id}>{props.children}</Heading3>
              ),
              a: (props) => (
                <BlogLink
                  href={props.href}
                  target={props.target}
                  rel={props.rel}
                >
                  {props.children}
                </BlogLink>
              ),
              ul: (props) => (
                <UnorderedList isTasksList={false}>
                  {props.children}
                </UnorderedList>
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
              // TODO: add quote, sidenotes, codesandbox components
              CodeBlockComponent: ({ files: { items } }) => (
                <CodeBlock items={items} />
              ),
              QuoteWithAuthorComponent: (props) => (
                <QuoteWithAuthor
                  quote={props.quote?.json.content}
                  author={props.author}
                  role={props.role}
                />
              ),
              CodeSandboxComponent: (props) => (
                <Sandbox keyName={props.sandboxKey} />
              ),
              SideNoteComponent: (props) => (
                <SideNote>{props.content?.json.content}</SideNote>
              ),
              TweetComponent: (props) => (
                <div className="dark grid w-full place-items-center">
                  <Tweet id={props.tweetId} />
                </div>
              )
            }}
            blocks={post?.content?.json.blocks}
          />
        </article>
        <BlogMeta categories={false} data={post as any} />
      </div>
    </div>
  )
}
