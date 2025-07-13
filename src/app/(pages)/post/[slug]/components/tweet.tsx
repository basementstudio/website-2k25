import Image from "next/image"
import { Tweet } from "react-tweet"
import { getTweet } from "react-tweet/api"

import rauchg from "./rauchg.jpg"

const RAUCHG_ID = "15540222"

interface CustomTweetProps {
  id: string
}

export const CustomTweet = async ({ id }: CustomTweetProps) => {
  const isValidTweetId = /^\d+$/.test(id)

  if (!isValidTweetId) return null

  try {
    const tweet = await getTweet(id)
    const isRauchTweet = tweet?.user.id_str === RAUCHG_ID

    return (
      <div className="dark mx-auto grid w-full max-w-[500px] place-items-center">
        <Tweet
          id={id}
          components={{
            AvatarImg: (props) => (
              <Image
                src={isRauchTweet ? rauchg : props.src}
                alt={props.alt}
                width={props.width}
                height={props.height}
              />
            )
          }}
        />
      </div>
    )
  } catch (error) {
    return (
      <div className="dark mx-auto grid w-full max-w-[500px] place-items-center rounded-lg border border-brand-g2 bg-brand-k p-6 text-center">
        <p className="text-brand-w2">Failed to load tweet: {id}</p>
        <p className="mt-2 text-sm text-brand-g1">
          The tweet may be private or no longer available
        </p>
      </div>
    )
  }
}
