import Image from "next/image"

import { QueryItemType } from "./query"

export function ProjectGallery({ entry }: { entry: QueryItemType }) {
  const showcase = entry.showcase.items
    .map((item) => item.image)
    .filter((image) => image !== null)

  return (
    <div className="col-span-10 flex flex-col gap-2">
      {showcase.map((image) => (
        <div
          key={image.url}
          className="relative aspect-video w-full overflow-hidden"
        >
          <Image
            src={image.url}
            alt={image.alt || ""}
            fill
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}
