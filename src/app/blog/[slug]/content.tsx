import { RichText } from "basehub/react-rich-text"

import { QueryType } from "../query"
import {
  BlogImage,
  BlogLink,
  BlogVideo,
  Code,
  Heading2,
  Heading3,
  Intro,
  ListItem,
  OrderedList,
  Paragraph,
  Pre,
  UnorderedList
} from "./blog-components"

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
        <article className="col-span-12 max-w-[900px] text-brand-w2">
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
              video: (props) => <BlogVideo {...props} />
            }}
          />
        </article>
      </div>
    </div>
  )
}
