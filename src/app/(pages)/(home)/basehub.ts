import { client } from "@/service/basehub"

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export const fetchBrandsMobile = async () => {
  const brands = await client().query({
    company: {
      clients: {
        clientList: {
          items: {
            _id: true,
            _title: true,
            logo: true,
            website: true
          }
        }
      }
    }
  })

  const shuffledBrands = shuffleArray(
    brands.company.clients.clientList.items.filter((item) => item.logo)
  )

  const row1Size = Math.floor(shuffledBrands.length * 0.4)
  const row2Size = Math.floor(shuffledBrands.length * 0.35)

  return {
    rows: [
      shuffledBrands.slice(0, row1Size),
      shuffledBrands.slice(row1Size, row1Size + row2Size),
      shuffledBrands.slice(row1Size + row2Size)
    ]
  }
}
