import { RichText } from "basehub/react-rich-text"

import { QueryType } from "./query"

export const Intro = ({ data }: { data: QueryType }) => {
  return (
    <section className="grid-layout">
      <article className="col-span-8 flex flex-col gap-4 text-brand-w1">
        <div>
          <RichText
            components={{
              p: ({ children }) => <h1 className="text-h1">{children}</h1>
            }}
          >
            {data.pages.homepage.intro.title?.json.content}
          </RichText>
        </div>
        <div className="grid grid-cols-2">
          <RichText
            components={{
              p: ({ children }) => <p className="!text-h4">{children}</p>
            }}
          >
            {data.pages.homepage.intro.subtitle?.json.content}
          </RichText>
        </div>
      </article>

      <article className="col-start-11 col-end-13">
        <B />
      </article>
    </section>
  )
}

const B = () => (
  <div className="with-dots grid aspect-video w-full place-items-center text-brand-w1">
    <div className="flex h-full w-full items-center justify-center border border-brand-w1/20">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="126"
        height="108"
        fill="none"
        viewBox="0 0 126 108"
      >
        <path
          stroke="currentColor"
          d="M44.048 64.115c1.084-3.78 5.104-6.83 9.001-6.83H64.2c2.038 0 3.63.834 4.532 2.17.823 1.22 1.07 2.857.553 4.66l-4.7 16.392c-1.084 3.78-5.105 6.83-9.002 6.83h-11.15c-2.038 0-3.631-.834-4.533-2.17-.823-1.219-1.07-2.856-.552-4.66zm-7.915 25.066c-1.339 4.669-.703 8.872 1.414 12.011 2.373 3.52 6.608 5.702 12.006 5.702h11.221c10.377 0 21.118-8.15 24.004-18.214l9.46-32.989c1.375-4.8.715-9.164-1.478-12.416-2.405-3.567-6.654-5.797-12.081-5.797H66.593c-8.263 0-16.873 6.693-19.235 14.685l11.066-38.59H35.887l-26.63 92.866h21.927zM113.334 87.337h-19.72l-5.484 19.124h19.72z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M27.402 1H49.94l8.483 12.576H35.885z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M49.938 1 38.872 39.59l8.483 12.575 11.065-38.59zM.772 93.866 27.402 1l8.482 12.576-26.63 92.866z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M38.872 39.592c2.362-7.991 10.972-14.684 19.235-14.684l8.483 12.575c-8.264 0-16.874 6.694-19.235 14.685z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M58.107 24.908h14.085l8.483 12.575H66.589zM44.562 44.711c-3.897 0-7.917 3.051-9.001 6.83l8.483 12.576c1.083-3.78 5.104-6.83 9-6.83zM55.714 44.711H44.563l8.482 12.576h11.151z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M84.273 30.704c-2.405-3.567-6.654-5.797-12.081-5.797l8.482 12.576c5.428 0 9.676 2.23 12.081 5.797zM35.562 51.543l-4.7 16.392 8.482 12.575 4.7-16.392zM60.244 46.881c-.902-1.336-2.495-2.17-4.532-2.17l8.482 12.576c2.038 0 3.63.834 4.532 2.17z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M60.246 46.88c.822 1.22 1.07 2.858.552 4.661l8.482 12.576c.517-1.804.27-3.441-.552-4.66zM31.412 72.593c-.823-1.22-1.07-2.857-.553-4.66l8.483 12.575c-.517 1.804-.27 3.441.552 4.66zM84.274 30.704c2.194 3.252 2.854 7.617 1.478 12.416l8.482 12.576c1.376-4.8.716-9.164-1.477-12.417z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M31.412 72.597c.902 1.336 2.495 2.17 4.532 2.17l8.482 12.575c-2.037 0-3.63-.834-4.532-2.17zM56.099 67.935l4.7-16.393 8.482 12.576-4.7 16.392zM29.06 88.622c-2.116-3.14-2.752-7.342-1.413-12.01l8.482 12.575c-1.339 4.668-.703 8.871 1.414 12.01zM22.699 93.864H.772l8.483 12.575H31.18z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="m27.644 76.611-4.949 17.257 8.483 12.576 4.948-17.257zM35.946 74.766h11.15l8.483 12.576H44.43zM47.098 74.763c3.897 0 7.917-3.05 9-6.83l8.483 12.576c-1.083 3.779-5.104 6.83-9 6.83zM85.752 43.118l-9.46 32.99 8.482 12.575 9.46-32.99z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M29.059 88.617c2.373 3.52 6.607 5.702 12.006 5.702l8.482 12.576c-5.398 0-9.633-2.182-12.006-5.702z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M52.287 94.325H41.066l8.482 12.575H60.77zM76.291 76.106c-2.885 10.063-13.627 18.213-24.003 18.213l8.483 12.576c10.376 0 21.117-8.15 24.003-18.214zM104.845 74.766h-19.72l8.483 12.576h19.72z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M85.128 74.766 79.644 93.89l8.483 12.576 5.484-19.124zM99.365 93.89l5.484-19.124 8.482 12.576-5.484 19.124z"
        />
        <path
          stroke="currentColor"
          strokeLinejoin="round"
          d="M79.645 93.886h19.72l8.482 12.576h-19.72z"
        />
        <path
          className="fill-brand-k"
          d="M35.562 51.542c1.084-3.779 5.105-6.83 9.002-6.83h11.15c3.898 0 6.169 3.051 5.085 6.83l-4.7 16.392c-1.084 3.78-5.105 6.83-9.002 6.83h-11.15c-3.898 0-6.169-3.05-5.085-6.83zM27.647 76.61c-2.84 9.903 3.208 17.712 13.42 17.712h11.221c10.377 0 21.118-8.15 24.004-18.213l9.46-32.99c2.885-10.062-3.182-18.213-13.559-18.213H58.108c-8.264 0-16.874 6.694-19.236 14.685L49.938 1H27.4L.772 93.866h21.927zM104.848 74.764h-19.72L79.645 93.89h19.72z"
        />
        <path
          stroke="#E6E6E6"
          d="M35.562 51.542c1.084-3.779 5.105-6.83 9.002-6.83h11.15c3.898 0 6.169 3.051 5.085 6.83l-4.7 16.392c-1.084 3.78-5.105 6.83-9.002 6.83h-11.15c-3.898 0-6.169-3.05-5.085-6.83zM27.647 76.61c-2.84 9.903 3.208 17.712 13.42 17.712h11.221c10.377 0 21.118-8.15 24.004-18.213l9.46-32.99c2.885-10.062-3.182-18.213-13.559-18.213H58.108c-8.264 0-16.874 6.694-19.236 14.685L49.938 1H27.4L.772 93.866h21.927zM104.848 74.764h-19.72L79.645 93.89h19.72z"
        />
      </svg>
    </div>
  </div>
)
