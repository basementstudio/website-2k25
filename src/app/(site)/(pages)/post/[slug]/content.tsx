import { PortableText } from "@portabletext/react"
import Image from "next/image"

import { Video } from "@/components/primitives/video"
import { getImageUrl } from "@/service/sanity/helpers"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"
import { cn } from "@/utils/cn"

import { Back } from "./back"
import { BlogMeta } from "./blog-meta"
import { Sandbox } from "./components/sandbox"
import { ShikiCodeBlock } from "./components/shiki-code-block"
import { CustomTweet } from "./components/tweet"
import type { PostDetail } from "./sanity"

interface ContentProps {
  post: PostDetail
}

const SITE_ORIGIN = "https://basement.studio"

const getLinkProps = (value?: {
  href?: string
  target?: string
  rel?: string
}) => {
  if (!value?.href) return {}

  try {
    const url = new URL(value.href, SITE_ORIGIN)
    const isExternal = url.origin !== SITE_ORIGIN

    return {
      href: value.href,
      target: value.target ?? (isExternal ? "_blank" : undefined),
      rel: value.rel ?? (isExternal ? "noopener noreferrer" : undefined)
    }
  } catch {
    return {
      href: value.href,
      target: value.target,
      rel: value.rel
    }
  }
}

export const Content = ({ post }: ContentProps) => {
  return (
    <div className="grid-layout">
      <div className="col-span-full lg:top-13 lg:col-span-1">
        <Back />
      </div>
      <div className="col-span-full flex flex-col items-center justify-start lg:col-span-10 lg:col-start-2">
        <BlogMeta categories data={post} />
        <article
          className={cn(
            "flex w-full flex-col items-start text-brand-w2 lg:max-w-[846px]",
            "[&>*]:mt-6",
            "[&>h2]:mt-12",
            "[&>.custom-block]:mt-6"
          )}
        >
          {post.intro && (
            <PortableText
              value={post.intro}
              components={{
                block: {
                  normal: ({ children }) => (
                    <p className="text-f-h3-mobile text-brand-w2 lg:text-f-h3 [&_b]:font-bold [&_b]:text-brand-w1">
                      {children}
                    </p>
                  )
                }
              }}
            />
          )}
          {post.content && (
            <PortableText
              value={post.content}
              components={{
                block: {
                  normal: ({ children }) => (
                    <p className="!text-pretty text-blog text-brand-w1 [&_b]:font-bold [&_b]:text-brand-w1">
                      {children}
                    </p>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-balance text-f-h2-mobile text-brand-w1 lg:text-f-h2 [&_b]:font-semibold">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-balance text-f-h3-mobile text-brand-w1 lg:text-f-h3 [&_b]:font-semibold">
                      {children}
                    </h3>
                  )
                },
                marks: {
                  link: ({ children, value }) => (
                    <a
                      {...getLinkProps(value)}
                      className="font-semibold text-brand-w1 underline"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="md:tracking-2 rounded-md border border-brand-g2 bg-codeblock-k2 px-1 font-mono text-f-p-mobile font-semibold lg:text-f-p">
                      {children}
                    </code>
                  )
                },
                list: {
                  bullet: ({ children }) => (
                    <ul className="blog-list list-none space-y-2 pl-5 text-brand-w2 marker:text-brand-o [&_ul]:marker:!text-brand-g1">
                      {children}
                    </ul>
                  ),
                  number: ({ children }) => (
                    <ol className="list-decimal pl-5 text-brand-w2 marker:text-brand-o [&_ol]:marker:!text-brand-g1">
                      {children}
                    </ol>
                  )
                },
                listItem: {
                  bullet: ({ children }) => (
                    <li className="blog-list-item !text-pretty pl-2 text-blog text-brand-w1 marker:text-f-p-mobile lg:text-f-p [&_b]:font-bold [&_b]:text-brand-w1">
                      {children}
                    </li>
                  ),
                  number: ({ children }) => (
                    <li className="blog-list-item !text-pretty pl-2 text-blog text-brand-w1 marker:text-f-p-mobile lg:text-f-p [&_b]:font-bold [&_b]:text-brand-w1">
                      {children}
                    </li>
                  )
                },
                types: {
                  codeBlock: ({
                    value
                  }: {
                    value: {
                      files: Array<{
                        title: string
                        code: string
                        language: string
                      }>
                    }
                  }) => (
                    <div className="custom-block sandbox group flex w-full flex-col gap-y-2">
                      <ShikiCodeBlock files={value.files ?? []} />
                    </div>
                  ),
                  image: ({
                    value
                  }: {
                    value: SanityImage & { caption?: string }
                  }) => {
                    const img = getImageUrl(value)
                    if (!img) return null
                    return (
                      <div className="flex w-full flex-col gap-y-2">
                        <div
                          className="image relative aspect-video w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20"
                          style={{
                            aspectRatio: img.width
                              ? `${img.width}/${img.height}`
                              : "16/9"
                          }}
                        >
                          <div className="with-dots grid h-full w-full place-items-center">
                            <Image
                              src={img.src}
                              fill
                              className="object-cover"
                              alt={img.alt ?? "Blog image"}
                            />
                          </div>
                        </div>
                        {value.caption && (
                          <p className="text-f-p-mobile text-brand-w1/50 lg:text-f-p">
                            {value.caption}
                          </p>
                        )}
                      </div>
                    )
                  },
                  quoteWithAuthor: ({
                    value
                  }: {
                    value: {
                      quote?: PortableTextBlock[]
                      author?: string
                      role?: string
                      avatar?: SanityImage
                    }
                  }) => {
                    const avatarImg = getImageUrl(value.avatar)
                    return (
                      <div className="custom-block relative mb-4 flex gap-x-4">
                        <div className="flex w-full flex-col gap-y-2.5">
                          {value.quote && (
                            <div className="lg:text-f-h2 [&>*]:text-f-h2-mobile [&>*]:text-brand-w2">
                              <PortableText value={value.quote} />
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2">
                            {avatarImg ? (
                              <Image
                                src={avatarImg.src}
                                alt={
                                  avatarImg.alt || `Avatar for ${value.author}`
                                }
                                width={32}
                                height={32}
                                className="size-8 rounded-full object-cover"
                              />
                            ) : null}
                            {value.author ? (
                              <p className="text-f-p-mobile text-brand-w2 lg:text-f-p">
                                {value.author}
                              </p>
                            ) : null}
                            {value.role ? (
                              <p className="text-f-p-mobile text-brand-g1 lg:text-f-p">
                                {value.role}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  },
                  codeSandbox: ({
                    value
                  }: {
                    value: { sandboxKey: string }
                  }) => <Sandbox keyName={value.sandboxKey} />,
                  sideNote: ({
                    value
                  }: {
                    value: { content?: PortableTextBlock[] }
                  }) => (
                    <div className="custom-block flex w-full flex-col gap-2 rounded-[0.25rem] border border-brand-g2 bg-codeblock-k2 px-6 py-4">
                      <p className="text-blog text-brand-w1">Note</p>
                      {value.content && (
                        <div className="[&>*]:text-brand-g1">
                          <PortableText
                            value={value.content}
                            components={{
                              block: {
                                normal: ({ children }) => (
                                  <p className="text-blog">{children}</p>
                                )
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ),
                  gridGallery: ({
                    value
                  }: {
                    value: {
                      images?: SanityImage[]
                      caption?: string
                    }
                  }) => (
                    <div className="flex w-full flex-col gap-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {value.images?.map((image, index) => {
                          const img = getImageUrl(image)
                          if (!img) return null
                          return (
                            <div
                              key={index}
                              className="image relative aspect-video w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20"
                              style={{
                                aspectRatio: img.width
                                  ? `${img.width}/${img.height}`
                                  : "16/9"
                              }}
                            >
                              <div className="with-dots grid h-full w-full place-items-center">
                                <Image
                                  src={img.src}
                                  fill
                                  className="object-cover"
                                  alt={img.alt || "Blog image"}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {value.caption && (
                        <p className="text-f-p-mobile text-brand-w1/50 lg:text-f-p">
                          {value.caption}
                        </p>
                      )}
                    </div>
                  ),
                  tweetEmbed: ({ value }: { value: { tweetId: string } }) => (
                    <CustomTweet id={value.tweetId} />
                  ),
                  videoEmbed: ({
                    value
                  }: {
                    value: { videoUrl?: string; caption?: string }
                  }) => {
                    if (!value.videoUrl) return null
                    return (
                      <div className="flex w-full flex-col gap-y-2">
                        <div className="video relative w-full overflow-hidden after:absolute after:inset-0 after:border after:border-brand-w1/20">
                          <div className="with-dots grid h-full w-full place-items-center">
                            <Video
                              src={value.videoUrl}
                              autoPlay
                              loop
                              muted
                              className="object-cover"
                            />
                          </div>
                        </div>
                        {value.caption && (
                          <p className="text-f-p-mobile text-brand-w1/50 lg:text-f-p">
                            {value.caption}
                          </p>
                        )}
                      </div>
                    )
                  }
                }
              }}
            />
          )}
        </article>
        <BlogMeta categories={false} data={post} />
      </div>
    </div>
  )
}
