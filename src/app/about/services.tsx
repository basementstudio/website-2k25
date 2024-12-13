import { QueryType } from "./query"

export const Services = ({ data }: { data: QueryType }) => {
  const servicesByCategory = data.company.services.serviceList.items.reduce(
    (acc, service) => {
      const category = service.category._title
      if (!acc[category]) acc[category] = []

      acc[category].push(service._title)
      return acc
    },
    {} as Record<string, string[]>
  )

  return (
    <section className="grid-layout">
      <div className="relative col-start-1 col-end-13 grid grid-cols-6 gap-2">
        <hr className="absolute top-5 w-full border-brand-w1/20" />
        {Object.entries(servicesByCategory).map(([category, services]) => (
          <div key={category} className="col-span-1 flex flex-col gap-5">
            <h2 className="text-paragraph text-brand-g1">{category}</h2>
            <ul>
              {services.map((service) => (
                <li key={service} className="text-subheading text-brand-w2">
                  {service}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
