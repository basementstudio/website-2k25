import Image from "next/image"
import { Tweet } from "react-tweet"
import { getTweet } from "react-tweet/api"

import rauchg from "./rauchg.jpg"

const RAUCHG_ID = "15540222"

interface CustomTweetProps {
  id: string
}

export const CustomTweet = async ({ id }: CustomTweetProps) => {
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
}
