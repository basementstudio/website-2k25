import { fragmentOn } from "basehub"

export const query = fragmentOn("Query", {
  pages: {
    blog: {
      posts: {
        items: {
          _sys: {
            createdAt: true
          },
          _title: true,
          _slug: true,
          date: true,
          intro: {
            json: { content: true }
          },
          categories: {
            _title: true
          },
          content: {
            json: {
              content: true,
              blocks: {
                __typename: true,

                on_CodeBlockComponent: {
                  __typename: true,
                  _id: true,

                  files: {
                    items: {
                      _id: true,
                      _title: true,
                      codeSnippet: {
                        code: true,
                        language: true
                      }
                    }
                  }
                },
                on_QuoteWithAuthorComponent: {
                  __typename: true,
                  _id: true,

                  quote: {
                    json: {
                      content: true
                    }
                  },
                  author: true,
                  role: true
                },
                on_CodeSanboxComponent: {
                  __typename: true,
                  _id: true,

                  _title: true,
                  sandboxUrl: true,
                  sourceCodeUrl: true
                }
              }
            }
          },
          hero: {
            heroImage: {
              url: true,
              blurDataURL: true,
              alt: true,
              width: true,
              height: true
            },
            heroVideo: {
              url: true
            }
          },
          authors: {
            _title: true
          }
        }
      },
      categories: {
        items: {
          _title: true
        }
      }
    }
  }
})

export type QueryType = fragmentOn.infer<typeof query>
