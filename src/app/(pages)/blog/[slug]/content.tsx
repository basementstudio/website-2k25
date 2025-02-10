import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

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
  UnorderedList
} from "./blog-components"
import BlogMeta from "./blog-meta"

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
        <article className="col-span-12 flex max-w-[900px] flex-col items-start text-brand-w2 [&>*]:mt-10 [&>h2+p]:!mt-0 [&>h2]:mb-6 [&>h3+p]:!mt-0 [&>h3]:mb-6 [&>p+p]:!mt-[7px]">
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
                <BlogLink href={props.href}>{props.children}</BlogLink>
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
