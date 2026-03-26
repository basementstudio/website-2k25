import { PortableText } from "@portabletext/react"
import Image from "next/image"

import { Sandbox } from "@/app/(site)/(pages)/post/[slug]/components/sandbox"
import { ShikiCodeBlock } from "@/app/(site)/(pages)/post/[slug]/components/shiki-code-block"
import { CustomTweet } from "@/app/(site)/(pages)/post/[slug]/components/tweet"
import { getImageUrl } from "@/service/sanity/helpers"
import type { PortableTextBlock, SanityImage } from "@/service/sanity/types"
import { cn } from "@/utils/cn"

interface JobContentProps {
  content: PortableTextBlock[]
}

export const JobContent = ({ content }: JobContentProps) => (
  <article
    className={cn(
      "flex w-full flex-col items-start text-brand-w2 lg:max-w-[846px]",
      "[&>*]:mt-6",
      "[&>h2]:mt-12"
    )}
  >
    <PortableText
      value={content}
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
              href={value?.href}
              target="_blank"
              rel="noopener noreferrer"
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
            <li className="blog-list-item !text-pretty pl-2 text-blog text-brand-w1 marker:text-f-p-mobile [&_b]:font-bold [&_b]:text-brand-w1">
              {children}
            </li>
          ),
          number: ({ children }) => (
            <li className="blog-list-item !text-pretty pl-2 text-blog text-brand-w1 marker:text-f-p-mobile [&_b]:font-bold [&_b]:text-brand-w1">
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
          image: ({ value }: { value: SanityImage }) => {
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
                      alt={img.alt || "Job description image"}
                    />
                  </div>
                </div>
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
                        alt={avatarImg.alt || `Avatar for ${value.author}`}
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
          codeSandbox: ({ value }: { value: { sandboxKey: string } }) => (
            <Sandbox keyName={value.sandboxKey} />
          ),
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
                          alt={img.alt || "Gallery image"}
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
          )
        }
      }}
    />
  </article>
)
