export interface PublicCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  image: {
    secureUrl: string
  }
  sortOrder: number
}
