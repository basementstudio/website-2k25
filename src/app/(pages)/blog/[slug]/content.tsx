import { RichText } from "basehub/react-rich-text"

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
      <div className="col-span-12 flex flex-col items-center justify-start">
        {post && <BlogMeta categories data={post as any} />}
        <article
          className={cn(
            "col-span-12 flex max-w-[846px] flex-col items-start text-brand-w2",
            // Default spacing between text elements
            "[&>*]:mt-10 [&>h2+p]:!mt-0 [&>h2]:mb-6 [&>h3+p]:!mt-0 [&>h3]:mb-6 [&>p+p]:!mt-[7px]",
            // Spacing for media elements (image, video, sandbox)
            "[&>.image]:mb-[24px] [&>.image]:mt-[88px] [&>.video]:mb-[24px] [&>.video]:mt-[88px]",
            // spacing for consecutive elements of same type
            "[&>.image+.image]:!mt-[24px]",

            "[&>.image+.video]:!mt-[24px]",
            "[&>.image+div>.sandbox]:!mt-[24px]",
            "[&>.video+.video]:!mt-[24px]",
            "[&>.video+.image]:!mt-[24px]",
            "[&>.video+div>.sandbox]:!mt-[24px]",
            "[&>div>.sandbox+.image]:!mt-[24px]",
            "[&>div>.sandbox+.video]:!mt-[24px]",
            "[&>div>.sandbox+div>.sandbox]:!mt-[24px]"
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
