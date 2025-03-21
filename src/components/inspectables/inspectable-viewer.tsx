"use client"

import { RichText as BaseRichText } from "basehub/react-rich-text"
import { Fragment, useEffect, useState } from "react"

import { useAssets } from "@/components/assets-provider"
import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useInspectable } from "@/components/inspectables/context"
import { cn } from "@/utils/cn"

type InspectableData = AssetsResult["inspectables"][number]

const Close = ({ handleClose }: { handleClose: () => void }) => (
  <button
    className="text-f-p-mobile lg:text-f-p text-brand-w1"
    tabIndex={0}
    onClick={handleClose}
  >
    Close [ESC]
  </button>
)

const Content = ({ data }: { data: InspectableData }) => (
  <>
    <h2 className="text-f-h2-mobile lg:text-f-h2 text-pretty text-brand-w1">
      {data._title}
    </h2>
    {data?.specs && data.specs.length > 0 && (
      <div className="flex flex-col border-t border-brand-w1/20">
        {data.specs.map((spec) => (
          <Fragment key={spec._id}>
            <div className="grid grid-cols-6 gap-2 border-b border-brand-w1/20 pb-1 pt-0.75">
              <h3 className="text-f-p-mobile lg:text-f-p col-span-2 text-brand-g1">
                {spec._title}
              </h3>
              <p
                className="text-f-p-mobile lg:text-f-p col-span-4 line-clamp-1 overflow-hidden text-ellipsis text-brand-w2"
                title={spec.value}
              >
                {spec.value}
              </p>
            </div>
          </Fragment>
        ))}
      </div>
    )}
    <div className="text-f-p-mobile lg:text-f-p text-brand-w1 [&>p]:!text-pretty">
      {data?.description?.json?.content && (
        <BaseRichText content={data.description.json.content as any} />
      )}
    </div>
  </>
)

export const InspectableViewer = () => {
  const { inspectables } = useAssets()
  const { selected, setSelected } = useInspectable()
  const [data, setData] = useState<InspectableData | null>(null)

  useEffect(() => {
    setData(null)

    if (!selected) return

    const fetchData = async () => {
      const inspectableData = inspectables.find(
        (inspectable) => inspectable.mesh === selected
      )

      setData(inspectableData ?? null)
    }

    fetchData()
  }, [selected, inspectables])

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 top-9 z-10 items-center",
        selected ? "flex" : "hidden"
      )}
    >
      <div className="grid-layout h-full">
        <div className="relative col-start-1 col-end-9 my-4 border border-brand-w1/20">
          <div className="with-dots !absolute -inset-px" />
        </div>
        <div className="pointer-events-auto col-start-9 col-end-13 ml-2 flex flex-col gap-18">
          <div className="row-span-1 flex h-44 w-full items-end">
            <Close handleClose={() => setSelected(null)} />
          </div>
          <div className="row-span-1 flex flex-col justify-center gap-4">
            {data && <Content data={data} />}
          </div>
        </div>
      </div>
    </div>
  )
}
