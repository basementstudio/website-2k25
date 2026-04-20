import {
  PortableText as BasePortableText,
  type PortableTextComponents,
  type PortableTextProps
} from "@portabletext/react"

import { Link } from "@/components/primitives/link"

interface CustomPortableTextProps {
  /** Portable Text block array (the `value` passed to @portabletext/react). */
  value: PortableTextProps["value"]
  /** Override or extend default serializers. */
  components?: PortableTextComponents
}

const defaultComponents: PortableTextComponents = {
  marks: {
    link: ({ children, value }) => (
      <Link href={value?.href ?? "#"} className="text-brand-w1">
        <span className="actionable">{children}</span>
      </Link>
    ),
    "strike-through": ({ children }) => (
      <span className="actionable">{children}</span>
    )
  },
  block: {
    normal: ({ children }) => (
      <p className="text-balance text-f-p-mobile text-brand-w2 lg:text-f-p">
        {children}
      </p>
    )
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal">{children}</ol>
  },
  listItem: {
    bullet: ({ children }) => <li className="text-brand-w1">{children}</li>,
    number: ({ children }) => <li className="text-brand-w1">{children}</li>
  }
}

export const PortableText = ({
  value,
  components
}: CustomPortableTextProps) => {
  if (!components) {
    return <BasePortableText value={value} components={defaultComponents} />
  }

  const merged = {
    ...defaultComponents,
    ...components,
    marks: { ...defaultComponents.marks, ...components.marks },
    block: {
      ...(typeof defaultComponents.block === "object"
        ? defaultComponents.block
        : {}),
      ...(typeof components.block === "object" ? components.block : {})
    },
    list: {
      ...(typeof defaultComponents.list === "object"
        ? defaultComponents.list
        : {}),
      ...(typeof components.list === "object" ? components.list : {})
    },
    listItem: {
      ...(typeof defaultComponents.listItem === "object"
        ? defaultComponents.listItem
        : {}),
      ...(typeof components.listItem === "object" ? components.listItem : {})
    }
  } satisfies PortableTextComponents

  return <BasePortableText value={value} components={merged} />
}
